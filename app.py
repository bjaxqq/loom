from __future__ import annotations

import os

from flask import Flask
from flask import jsonify
from flask import request
from flask import send_from_directory

from flow_builder.generator import BlueprintGenerator
from flow_builder.mock_data import DEMO_SCENARIOS


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "static")

generator = BlueprintGenerator()

app = Flask(__name__, static_folder = STATIC_DIR, static_url_path = "")


@app.get("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "mode": generator.mode,
        }
    )


@app.get("/api/scenarios")
def scenarios():
    return jsonify(
        {
            "items": DEMO_SCENARIOS,
        }
    )


@app.post("/api/generate")
def generate():
    body = request.get_json(silent = True) or {}
    user_input = str(body.get("prompt", "")).strip()

    if not user_input:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        blueprint = generator.generate(user_input)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(
        {
            "mode": generator.mode,
            "blueprint": blueprint,
        }
    )


@app.get("/<path:path>")
def static_files(path: str):
    return send_from_directory(STATIC_DIR, path)


def main() -> None:
    host = os.environ.get("APP_HOST", "127.0.0.1")
    port = int(os.environ.get("APP_PORT", "8000"))

    print(f"Serving app at http://{host}:{port}")
    print(f"Generation mode = {generator.mode}")

    app.run(host = host, port = port, debug = False)


if __name__ == "__main__":
    main()
