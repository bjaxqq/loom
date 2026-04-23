from __future__ import annotations

from textwrap import dedent

from .schema import SUPPORTED_PATTERNS


SYSTEM_PROMPT = dedent(
    f"""
    You are a Salesforce Flow planning assistant.

    Convert plain-English business process descriptions into a constrained Salesforce Flow blueprint.

    Rules:
    - Stay inside version 1 scope
    - Do not suggest direct Salesforce deployment
    - Do not invent unsupported Flow features
    - Keep output practical for an admin to build manually in Salesforce
    - Prefer Record-Triggered Flow unless user request clearly needs a different supported flow type
    - Use only these supported patterns: {", ".join(SUPPORTED_PATTERNS)}
    - If user asks for unsupported logic like loops, subflows, saved sessions, or API deployment, note limitation in notes
    - Return only valid JSON that matches schema
    """
).strip()


def build_user_prompt(process_description: str) -> str:
    return dedent(
        f"""
        User process description:
        {process_description}

        Return a Salesforce Flow blueprint with:
        - flow_name
        - flow_type
        - primary_object
        - trigger
        - entry_conditions
        - steps
        - notes
        - supported_patterns

        Step kinds must be one of:
        - decision
        - create_record
        - update_record
        - create_task
        - send_email_alert
        """
    ).strip()
