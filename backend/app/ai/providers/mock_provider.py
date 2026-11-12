"""Canned responses. For automated tests and offline UI development ONLY."""
from app.ai.base import LLMProvider

DEFAULT_ANALYSIS = {
    "match_score": 72,
    "summary": "Mock analysis: solid overlap on core skills with a few gaps.",
    "matching_skills": ["Python", "SQL", "REST APIs"],
    "missing_skills": ["Docker", "AWS"],
    "relevant_experience": ["Built a REST API project"],
    "education_analysis": "Degree requirement appears to be met.",
    "keywords": ["FastAPI", "Docker", "CI/CD"],
    "suggestions": ["Add measurable results to project bullets.", "Mention deployment experience."],
}


class MockLLMProvider(LLMProvider):
    model_name = "mock-model"

    def __init__(self, json_responses: list | None = None, chat_reply: str = "Mock assistant reply."):
        self.json_responses = list(json_responses) if json_responses else [DEFAULT_ANALYSIS]
        self.chat_reply = chat_reply
        self.json_calls = 0
        self.last_chat_args: dict = {}

    def generate_json(self, system: str, user: str) -> dict:
        index = min(self.json_calls, len(self.json_responses) - 1)
        self.json_calls += 1
        item = self.json_responses[index]
        if isinstance(item, Exception):
            raise item
        return item

    def chat(self, system, messages, tools=None, tool_handler=None):
        self.last_chat_args = {"system": system, "messages": messages, "tools": tools}
        used = []
        if tools and tool_handler:  # exercise the tool path like a real agent would
            tool_handler(tools[0]["name"], {})
            used.append(tools[0]["name"])
        return self.chat_reply, used
