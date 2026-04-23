from __future__ import annotations

import json
import urllib.error
import urllib.request
from textwrap import dedent

from .config import load_settings
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .schema import FLOW_BLUEPRINT_SCHEMA, validate_blueprint


class BlueprintGenerator:
    def __init__(self) -> None:
        self.settings = load_settings()


    @property
    def mode(self) -> str:
        if self.settings.gemini_api_key or self.settings.openai_api_key:
            return "live"

        return "mock"


    def generate(self, process_description: str, history: list | None = None) -> dict:
        if self.settings.gemini_api_key:
            blueprint = self._generate_with_gemini(process_description, history or [])
        elif self.settings.openai_api_key:
            blueprint = self._generate_with_openai(process_description)
        else:
            blueprint = self._generate_mock_blueprint(process_description)

        errors = validate_blueprint(blueprint)

        if errors:
            joined_errors = "; ".join(errors)
            raise ValueError(f"Generated blueprint failed validation: {joined_errors}")

        return blueprint


    def _gemini_schema(self, schema: dict) -> dict:
        """Strip additionalProperties — Gemini's response_schema doesn't support it."""
        cleaned = {k: v for k, v in schema.items() if k != "additionalProperties"}

        if "properties" in cleaned:
            cleaned["properties"] = {
                k: self._gemini_schema(v) for k, v in cleaned["properties"].items()
            }

        if "items" in cleaned:
            cleaned["items"] = self._gemini_schema(cleaned["items"])

        return cleaned


    def _generate_with_gemini(self, process_description: str, history: list | None = None) -> dict:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.gemini_model}:generateContent"
            f"?key={self.settings.gemini_api_key}"
        )

        contents = []
        for msg in (history or []):
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ("user", "model"):
                contents.append({"role": role, "parts": [{"text": content}]})

        contents.append({"role": "user", "parts": [{"text": build_user_prompt(process_description)}]})

        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}],
            },
            "contents": contents,
            "generationConfig": {
                "response_mime_type": "application/json",
                "response_schema": self._gemini_schema(FLOW_BLUEPRINT_SCHEMA),
            },
        }

        req = urllib.request.Request(
            url,
            data = json.dumps(payload).encode("utf-8"),
            headers = {"Content-Type": "application/json"},
            method = "POST",
        )

        try:
            with urllib.request.urlopen(req, timeout = self.settings.request_timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            raise ValueError(f"Gemini API error {e.code}: {body}") from e

        parsed = json.loads(raw)
        output_text = parsed["candidates"][0]["content"]["parts"][0]["text"]

        return json.loads(output_text)


    def _generate_with_openai(self, process_description: str) -> dict:
        payload = {
            "model": self.settings.openai_model,
            "instructions": SYSTEM_PROMPT,
            "input": build_user_prompt(process_description),
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "salesforce_flow_blueprint",
                    "strict": True,
                    "schema": FLOW_BLUEPRINT_SCHEMA,
                }
            },
        }

        request = urllib.request.Request(
            self.settings.openai_url,
            data = json.dumps(payload).encode("utf-8"),
            headers = {
                "Authorization": f"Bearer {self.settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            method = "POST",
        )

        with urllib.request.urlopen(request, timeout = self.settings.request_timeout_seconds) as response:
            raw = response.read().decode("utf-8")

        parsed = json.loads(raw)
        output_text = parsed.get("output_text") or self._extract_output_text(parsed)

        if not output_text:
            raise ValueError("Model response did not include output text")

        return json.loads(output_text)


    def _extract_output_text(self, response_payload: dict) -> str:
        for item in response_payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    return content.get("text", "")

        return ""


    def _generate_mock_blueprint(self, process_description: str) -> dict:
        prompt = process_description.lower()

        blueprint = {
            "flow_name": "Business Process Blueprint",
            "flow_type": "Record-Triggered Flow",
            "primary_object": "Lead",
            "trigger": "Record is created or updated",
            "entry_conditions": [
                "Review admin criteria based on described process",
            ],
            "steps": [],
            "notes": [
                "Mock mode active because OPENAI_API_KEY is not set",
                "Blueprint is a strong starting point, but admin review is still required",
            ],
            "supported_patterns": [],
        }

        if "lead" in prompt:
            blueprint["flow_name"] = "Lead Follow-up Blueprint"
            blueprint["primary_object"] = "Lead"

        if "opportunity" in prompt or "deal" in prompt:
            blueprint["flow_name"] = "Opportunity Process Blueprint"
            blueprint["primary_object"] = "Opportunity"

        if "case" in prompt:
            blueprint["flow_name"] = "Case Escalation Blueprint"
            blueprint["primary_object"] = "Case"

        if "when" in prompt and "created" in prompt:
            blueprint["trigger"] = "Record is created"
            blueprint["supported_patterns"].append("record creation triggers")

        if "updated" in prompt or "changes to" in prompt or "becomes" in prompt:
            blueprint["trigger"] = "Record is updated"

        if "converted" in prompt:
            blueprint["entry_conditions"] = [
                "Lead.IsConverted = true",
            ]

        elif "priority" in prompt and "high" in prompt:
            blueprint["entry_conditions"] = [
                "Case.Priority = High",
            ]

        elif "proposal" in prompt:
            blueprint["entry_conditions"] = [
                "Opportunity.StageName = Proposal",
            ]

        if "update" in prompt or "changes to" in prompt:
            blueprint["steps"].append(
                {
                    "label": "Update record values",
                    "kind": "update_record",
                    "details": [
                        "Set requested field values from user description",
                    ],
                }
            )
            blueprint["supported_patterns"].append("field updates")

        if "task" in prompt:
            blueprint["steps"].append(
                {
                    "label": "Create follow-up task",
                    "kind": "create_task",
                    "details": [
                        "Assign task to record owner",
                        "Set due date based on described timing",
                    ],
                }
            )
            blueprint["supported_patterns"].append("task creation")

        if "email" in prompt:
            blueprint["steps"].append(
                {
                    "label": "Send email alert",
                    "kind": "send_email_alert",
                    "details": [
                        "Use matching template for business event",
                        "Send to described recipient",
                    ],
                }
            )
            blueprint["supported_patterns"].append("email alerts")

        if "above" in prompt or "below" in prompt or "another" in prompt:
            blueprint["steps"].insert(
                0,
                {
                    "label": "Evaluate decision criteria",
                    "kind": "decision",
                    "details": [
                        "Branch flow using deal size or field-based rule from description",
                    ],
                }
            )
            blueprint["supported_patterns"].append("decision branching")

        if not blueprint["steps"]:
            blueprint["steps"].append(
                {
                    "label": "Create record action",
                    "kind": "create_record",
                    "details": [
                        "Map described business outcome to a Salesforce record action",
                    ],
                }
            )

        blueprint["supported_patterns"] = sorted(set(blueprint["supported_patterns"]))

        if "loop" in prompt or "subflow" in prompt:
            blueprint["notes"].append("Requested logic includes unsupported v1 capability")

        blueprint["notes"].append(self._render_summary_note(process_description, blueprint))

        return blueprint


    def _render_summary_note(self, process_description: str, blueprint: dict) -> str:
        summary = dedent(
            f"""
            Input summary = {process_description.strip()}
            Planned object = {blueprint['primary_object']}
            Planned trigger = {blueprint['trigger']}
            """
        ).strip()

        return " | ".join(summary.splitlines())
