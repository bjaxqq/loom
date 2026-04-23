# Loom

Loom is a web app for turning plain-English business process descriptions into Salesforce Flow drafts.

It gives you:

- A lightweight web UI for plain-English process input
- Structured Salesforce Flow draft output
- A bounded version 1 scope that matches proposal
- OpenAI integration when `OPENAI_API_KEY` is set
- Mock mode fallback for demos, testing, and iteration


## Project shape

`app.py`

- Small Python server
- Serves static frontend
- Exposes `/api/health` and `/api/generate`

`flow_builder/`

- `config.py` for env-based settings
- `prompts.py` for system prompt and user prompt assembly
- `schema.py` for v1 output shape and validation
- `generator.py` for live generation and mock fallback
- `mock_data.py` for seeded test scenarios

`static/`

- Input form
- Demo scenarios
- Structured result view
- Raw JSON view for debugging and validation


## Version 1 scope

Supported patterns:

- Record creation triggers
- Field updates
- Task creation
- Email alerts
- Decision branching

Explicitly out of scope:

- Direct Salesforce API deployment
- Multi-turn saved conversations
- User auth
- Subflows
- Complex loops


## Run it

From project folder:

```bash
python3 app.py
```

Then open:

```text
http://127.0.0.1:8000
```


## Live OpenAI mode

Set env vars before starting server:

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_MODEL="gpt-4.1-mini"
python3 app.py
```

Without an API key, app runs in mock mode automatically.


## Why mock mode matters

Mock mode gives you a stable fallback when:

- You want to demo app without spending API credits
- Network access is unavailable
- You need predictable output for class screenshots
- You want to validate front-end flow before tuning prompts


## Suggested next steps

1. Add a small evaluation script for five required test scenarios
2. Tighten field-level output for common Salesforce objects
3. Add richer prompt guardrails for component naming
4. Export blueprint as Markdown or PDF for submission artifacts
