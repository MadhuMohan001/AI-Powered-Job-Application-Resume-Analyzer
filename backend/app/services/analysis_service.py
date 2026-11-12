import logging

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.base import LLMProvider
from app.ai.prompts import ANALYSIS_SYSTEM, PROMPT_VERSION, build_analysis_user_prompt
from app.core.exceptions import AIServiceError, NotFoundError
from app.models import ResumeAnalysis, User
from app.schemas.analysis import AnalysisListItem, AnalysisOut, AnalysisResult
from app.services.resume_service import get_owned_job, get_owned_resume

logger = logging.getLogger(__name__)
MAX_ATTEMPTS = 2


def analyze(db: Session, user: User, llm: LLMProvider, resume_id: int, job_id: int) -> ResumeAnalysis:
    resume = get_owned_resume(db, user, resume_id)
    job = get_owned_job(db, user, job_id)
    prompt = build_analysis_user_prompt(resume.extracted_text, job.title, job.company, job.description)

    result: AnalysisResult | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            result = AnalysisResult.model_validate(llm.generate_json(ANALYSIS_SYSTEM, prompt))
            break
        except (ValidationError, AIServiceError) as exc:
            logger.warning("Analysis attempt %d failed: %s", attempt, type(exc).__name__)
            if attempt == MAX_ATTEMPTS:
                if isinstance(exc, AIServiceError):
                    raise
                raise AIServiceError("The AI response did not match the expected format. Please try again.")

    analysis = ResumeAnalysis(
        user_id=user.id,
        resume_id=resume.id,
        job_id=job.id,
        match_score=result.match_score,
        result=result.model_dump(),
        model_name=llm.model_name,
        prompt_version=PROMPT_VERSION,
    )
    db.add(analysis)
    db.commit()
    return analysis


def to_out(analysis: ResumeAnalysis) -> AnalysisOut:
    return AnalysisOut(
        id=analysis.id,
        resume_id=analysis.resume_id,
        job_id=analysis.job_id,
        resume_title=analysis.resume.title,
        job_title=analysis.job.title,
        company=analysis.job.company,
        match_score=analysis.match_score,
        result=AnalysisResult.model_validate(analysis.result),
        model_name=analysis.model_name,
        prompt_version=analysis.prompt_version,
        created_at=analysis.created_at,
    )


def to_list_item(a: ResumeAnalysis) -> AnalysisListItem:
    return AnalysisListItem(
        id=a.id, resume_title=a.resume.title, job_title=a.job.title, company=a.job.company,
        match_score=a.match_score, created_at=a.created_at,
    )


def get_owned_analysis(db: Session, user: User, analysis_id: int) -> ResumeAnalysis:
    analysis = db.scalar(
        select(ResumeAnalysis).where(ResumeAnalysis.id == analysis_id, ResumeAnalysis.user_id == user.id)
    )
    if not analysis:
        raise NotFoundError("Analysis not found.")
    return analysis


def history(db: Session, user: User, limit: int = 100) -> list[ResumeAnalysis]:
    return list(
        db.scalars(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user.id)
            .order_by(ResumeAnalysis.created_at.desc(), ResumeAnalysis.id.desc())
            .limit(limit)
        )
    )
