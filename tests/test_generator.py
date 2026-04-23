from __future__ import annotations

import unittest

from flow_builder.generator import BlueprintGenerator
from flow_builder.schema import validate_blueprint


class GeneratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.generator = BlueprintGenerator()


    def test_mock_generator_returns_valid_blueprint(self) -> None:
        blueprint = self.generator._generate_mock_blueprint(
            "When a lead is converted, create a task and send an email alert"
        )

        errors = validate_blueprint(blueprint)

        self.assertEqual(errors, [])
        self.assertEqual(blueprint["primary_object"], "Lead")
        self.assertIn("task creation", blueprint["supported_patterns"])
        self.assertIn("email alerts", blueprint["supported_patterns"])


    def test_decision_prompt_adds_decision_step(self) -> None:
        blueprint = self.generator._generate_mock_blueprint(
            "When an opportunity stage becomes Proposal, send one email for deals above $50,000 and another email for smaller deals"
        )

        self.assertEqual(blueprint["steps"][0]["kind"], "decision")
        self.assertIn("decision branching", blueprint["supported_patterns"])


if __name__ == "__main__":
    unittest.main()
