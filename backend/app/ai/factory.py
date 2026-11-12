from app.ai.base import LLMProvider
from app.core.config import get_settings
from app.core.exceptions import AIServiceError


def get_llm_provider() -> LLMProvider:
    """FastAPI dependency. Tests override this with a MockLLMProvider."""
    settings = get_settings()
    if settings.llm_provider == "anthropic":
        from app.ai.providers.anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings.anthropic_api_key, settings.llm_model)
    if settings.llm_provider == "mock":
        from app.ai.providers.mock_provider import MockLLMProvider

        return MockLLMProvider()
    raise AIServiceError(f"Unknown LLM_PROVIDER '{settings.llm_provider}'.")
