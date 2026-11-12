from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.base import LLMProvider
from app.ai.factory import get_llm_provider
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.analysis import AnalysisListItem, AnalysisOut, AnalysisRequest
from app.services import analysis_service

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisOut, status_code=201)
def analyze(
    req: AnalysisRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm: LLMProvider = Depends(get_llm_provider),
):
    analysis = analysis_service.analyze(db, user, llm, req.resume_id, req.job_id)
    return analysis_service.to_out(analysis)


# NOTE: "/history" must be declared before "/{analysis_id}" or FastAPI would treat "history" as an id.
@router.get("/history", response_model=list[AnalysisListItem])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [analysis_service.to_list_item(a) for a in analysis_service.history(db, user)]


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analysis_service.to_out(analysis_service.get_owned_analysis(db, user, analysis_id))


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(analysis_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(analysis_service.get_owned_analysis(db, user, analysis_id))
    db.commit()
