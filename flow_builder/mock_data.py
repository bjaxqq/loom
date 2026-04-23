from __future__ import annotations


DEMO_SCENARIOS = [
    {
        "title": "Lead conversion follow-up",
        "prompt": "When a lead is converted, create a follow-up task for the owner and send a welcome email to the lead",
    },
    {
        "title": "Case escalation",
        "prompt": "When a case priority changes to High, update the status to Escalated and email the support manager",
    },
    {
        "title": "New opportunity task",
        "prompt": "When a new opportunity is created over $25,000, create a task for the account executive to schedule discovery",
    },
    {
        "title": "Renewal reminder",
        "prompt": "When a contract renewal date is 30 days away, send an email alert to the account owner",
    },
    {
        "title": "Decision branch by deal size",
        "prompt": "When an opportunity stage becomes Proposal, send one email for deals above $50,000 and another email for smaller deals",
    },
]
