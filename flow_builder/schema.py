from __future__ import annotations


SUPPORTED_PATTERNS = [
    "record creation triggers",
    "field updates",
    "task creation",
    "email alerts",
    "decision branching",
]


FLOW_BLUEPRINT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "flow_name",
        "flow_type",
        "primary_object",
        "trigger",
        "entry_conditions",
        "steps",
        "notes",
        "supported_patterns",
    ],
    "properties": {
        "flow_name": {
            "type": "string",
        },
        "flow_type": {
            "type": "string",
            "enum": [
                "Record-Triggered Flow",
                "Screen Flow",
                "Scheduled Flow",
            ],
        },
        "primary_object": {
            "type": "string",
        },
        "trigger": {
            "type": "string",
        },
        "entry_conditions": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "steps": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "label",
                    "kind",
                    "details",
                ],
                "properties": {
                    "label": {
                        "type": "string",
                    },
                    "kind": {
                        "type": "string",
                        "enum": [
                            "decision",
                            "create_record",
                            "update_record",
                            "create_task",
                            "send_email_alert",
                        ],
                    },
                    "details": {
                        "type": "array",
                        "items": {
                            "type": "string",
                        },
                    },
                },
            },
        },
        "notes": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "supported_patterns": {
            "type": "array",
            "items": {
                "type": "string",
                "enum": SUPPORTED_PATTERNS,
            },
        },
    },
}


def validate_blueprint(blueprint: dict) -> list[str]:
    errors: list[str] = []

    required_fields = FLOW_BLUEPRINT_SCHEMA["required"]

    for field in required_fields:
        if field not in blueprint:
            errors.append(f"Missing field: {field}")

    if not isinstance(blueprint.get("steps"), list) or not blueprint.get("steps"):
        errors.append("steps must contain at least one step")

    if blueprint.get("flow_type") not in FLOW_BLUEPRINT_SCHEMA["properties"]["flow_type"]["enum"]:
        errors.append("flow_type is invalid")

    for step in blueprint.get("steps", []):
        if step.get("kind") not in FLOW_BLUEPRINT_SCHEMA["properties"]["steps"]["items"]["properties"]["kind"]["enum"]:
            errors.append(f"Unsupported step kind: {step.get('kind')}")

    for pattern in blueprint.get("supported_patterns", []):
        if pattern not in SUPPORTED_PATTERNS:
            errors.append(f"Unsupported pattern: {pattern}")

    return errors
