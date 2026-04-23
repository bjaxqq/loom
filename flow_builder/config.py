from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen = True)
class Settings:
    openai_api_key: str | None
    openai_model: str
    openai_url: str
    request_timeout_seconds: int


def load_settings() -> Settings:
    return Settings(
        openai_api_key = os.environ.get("OPENAI_API_KEY"),
        openai_model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        openai_url = os.environ.get("OPENAI_URL", "https://api.openai.com/v1/responses"),
        request_timeout_seconds = int(os.environ.get("OPENAI_TIMEOUT_SECONDS", "20")),
    )
