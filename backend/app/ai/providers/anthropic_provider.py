import logging

from app.ai.base import LLMProvider, ToolHandler, extract_json
from app.core.exceptions import AIServiceError

logger = logging.getLogger(__name__)
MAX_TOOL_STEPS = 4


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise AIServiceError("ANTHROPIC_API_KEY is not configured on the server.")
        import anthropic  # imported lazily so the mock provider works without the SDK

        self._anthropic = anthropic
        self.client = anthropic.Anthropic(api_key=api_key, timeout=60.0)
        self.model_name = model

    def _create(self, **kwargs):
        try:
            return self.client.messages.create(model=self.model_name, **kwargs)
        except self._anthropic.APIError as exc:
            # Log the error type only: never log prompts, which contain resume text.
            logger.error("LLM request failed: %s", type(exc).__name__)
            raise AIServiceError("The AI service is unavailable right now. Please try again.") from exc

    @staticmethod
    def _text(response) -> str:
        return "".join(block.text for block in response.content if block.type == "text")

    def generate_json(self, system: str, user: str) -> dict:
        response = self._create(
            max_tokens=2500,
            temperature=0.2,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return extract_json(self._text(response))

    def chat(self, system, messages, tools=None, tool_handler: ToolHandler | None = None):
        convo = list(messages)
        used: list[str] = []
        for _ in range(MAX_TOOL_STEPS):
            kwargs = {"max_tokens": 1500, "system": system, "messages": convo}
            if tools:
                kwargs["tools"] = tools
            response = self._create(**kwargs)
            if response.stop_reason != "tool_use" or not tool_handler:
                return self._text(response), used

            convo.append({"role": "assistant", "content": response.content})
            results = []
            for block in response.content:
                if block.type == "tool_use":
                    used.append(block.name)
                    output = tool_handler(block.name, dict(block.input))
                    results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
            convo.append({"role": "user", "content": results})
        raise AIServiceError("The assistant took too many steps. Please rephrase your question.")
