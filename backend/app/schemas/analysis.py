from datetime import datetime

from pydantic import BaseModel, Field

DISCLAIMER = (
    "This score is an AI-generated estimate to help you improve your resume. "
    "It is not a prediction of hiring decisions, and real recruiters or ATS systems may differ."
)


class AnalysisRequest(BaseModel):
    resume_id: int
    job_id: int


class AnalysisResult(BaseModel):
    """The structure the LLM must return. Validated before saving."""
    match_score: int = Field(ge=0, le=100)
    summary: str
    matching_skills: list[str]
    missing_skills: list[str]
    relevant_experience: list[str]
    education_analysis: str
    keywords: list[str]
    suggestions: list[str]


class AnalysisOut(BaseModel):
    id: int
    resume_id: int
    job_id: int
    resume_title: str
    job_title: str
    company: str
    match_score: int
    result: AnalysisResult
    model_name: str
    prompt_version: str
    created_at: datetime
    disclaimer: str = DISCLAIMER


class AnalysisListItem(BaseModel):
    id: int
    resume_title: str
    job_title: str
    company: str
    match_score: int
    created_at: datetime
