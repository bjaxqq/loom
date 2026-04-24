# loom

Loom turns plain-English business process descriptions into structured Salesforce Flow blueprints.

Live at: [loom-liard.vercel.app/](loom-liard.vercel.app/)


## What it does

Type a workflow description such as:

> When a lead is converted, create a follow-up task and send a welcome email

Loom returns a structured blueprint with:

- flow name, type, and primary object
- trigger and entry conditions
- step-by-step flow map with color-coded nodes
- patterns used
- implementation notes
- exportable JSON and Markdown

Blueprints are drafts for review. The goal is a clean starting point an admin can build from in Salesforce Flow Builder.


## Supported patterns

- Record creation triggers
- Field updates
- Task creation
- Email alerts
- Decision branching


## Stack

- Python + Flask
- Gemini API (gemini-2.5-flash) for blueprint generation
- Vanilla HTML, CSS, JavaScript
- Vercel for deployment


## Run locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Add a `.env` file:

```
GEMINI_API_KEY=your_key_here
```

Start the app:

```bash
.venv/bin/python app.py
```

Open `http://127.0.0.1:8000`.

If no API key is set, Loom runs in mock mode automatically.


## Deployment

Deployed on Vercel using `vercel.json` and `api/index.py`. Set `GEMINI_API_KEY` in the Vercel dashboard under Settings → Environment Variables.


## Out of scope (v1)

- Direct Salesforce API deployment
- Saved sessions
- Authentication
- Subflows
