from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.base import LLMProvider
from app.ai.factory import get_llm_provider
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm: LLMProvider = Depends(get_llm_provider),
):
    return assistant_service.chat(db, user, llm, req)
