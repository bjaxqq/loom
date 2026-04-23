# Loom

Loom is a web app that turns plain-English business process descriptions into Salesforce Flow drafts.

The current version is built around a narrow first scope:

- plain-English input
- structured Flow draft output
- five supported Flow patterns
- local mock mode and optional Gemini (or OpenAI) live mode


## What it does

You type a workflow request such as:

> When a lead is converted, create a follow-up task and send a welcome email

Loom returns a structured draft with:

- flow name
- flow type
- primary object
- trigger
- entry rules
- flow steps
- notes

The goal is not direct Salesforce deployment yet. The goal is a clean draft an admin can review and build from.


## Current scope

Supported patterns:

- record creation triggers
- field updates
- task creation
- email alerts
- decision branching

Out of scope for this version:

- direct Salesforce API deployment
- saved sessions
- authentication
- subflows
- complex loops


## Stack

- Python
- Flask
- HTML
- CSS
- JavaScript
- Vercel for deployment


## Project structure

`app.py`

- Flask app for routes and static file serving

`api/`

- Vercel entrypoint

`flow_builder/`

- prompt logic
- schema and validation
- generation logic
- sample scenarios

`static/`

- frontend UI

`tests/`

- basic generator tests


## Run locally

Create a virtual environment:

```bash
python3 -m venv .venv
```

Install dependencies:

```bash
.venv/bin/pip install -r requirements.txt
```

Start the app:

```bash
.venv/bin/python app.py
```

Then open:

```text
http://127.0.0.1:8000
```


## Live mode

Loom checks for `GEMINI_API_KEY` first, then `OPENAI_API_KEY`. Set whichever you have before starting:

```bash
export GEMINI_API_KEY="your_key_here"
.venv/bin/python app.py
```

If neither key is set, Loom runs in mock mode automatically.


## Deployment

This project is set up for Vercel with:

- `vercel.json`
- `api/index.py`
- `requirements.txt`

That keeps local development and deployment on the same app shape.


## Next steps

- add evaluation for five required test cases
- improve output consistency for common Salesforce objects
- tighten prompt guardrails and validation
- add report assets and demo documentation


## Notes

This project started as a final project build and is being kept in repo form so it can keep evolving over time.
