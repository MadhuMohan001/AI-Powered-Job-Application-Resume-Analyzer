"""Provider-agnostic LLM interface. Business logic only ever talks to this class."""
import json
import re
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from app.core.exceptions import AIServiceError

ToolHandler = Callable[[str, dict[str, Any]], str]


def extract_json(text: str) -> dict:
    """Parse a JSON object from model output, tolerating ```json fences and stray prose."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end <= start:
            raise AIServiceError("The AI returned a response that was not valid JSON.")
        try:
            data = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            raise AIServiceError("The AI returned a response that was not valid JSON.")
    if not isinstance(data, dict):
        raise AIServiceError("The AI returned an unexpected JSON structure.")
    return data


class LLMProvider(ABC):
    model_name: str

    @abstractmethod
    def generate_json(self, system: str, user: str) -> dict:
        """Ask the model for a JSON object and return it parsed."""

    @abstractmethod
    def chat(
        self,
        system: str,
        messages: list[dict[str, str]],
        tools: list[dict] | None = None,
        tool_handler: ToolHandler | None = None,
    ) -> tuple[str, list[str]]:
        """Return (reply_text, names_of_tools_used). Runs the tool-calling loop if tools are given."""
