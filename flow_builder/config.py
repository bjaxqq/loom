from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen = True)
class Settings:
    gemini_api_key: str | None
    gemini_model: str
    openai_api_key: str | None
    openai_model: str
    openai_url: str
    request_timeout_seconds: int


def load_settings() -> Settings:
    return Settings(
        gemini_api_key = os.environ.get("GEMINI_API_KEY"),
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        openai_api_key = os.environ.get("OPENAI_API_KEY"),
        openai_model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
        openai_url = os.environ.get("OPENAI_URL", "https://api.openai.com/v1/responses"),
        request_timeout_seconds = int(os.environ.get("REQUEST_TIMEOUT_SECONDS", "20")),
    )
