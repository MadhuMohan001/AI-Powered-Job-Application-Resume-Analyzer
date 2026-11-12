from pydantic import BaseModel

from app.schemas.analysis import AnalysisListItem


class DashboardSummary(BaseModel):
    total_resumes: int
    total_jobs: int
    total_analyses: int
    average_match_score: float | None
    recent_analyses: list[AnalysisListItem]
    applications_by_status: dict[str, int]
