from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    original_name: str
    file_type: str
    file_size: int
    created_at: datetime


class ResumeInfo(BaseModel):
    email: str | None = None
    phone: str | None = None
    word_count: int = 0


class ResumeDetail(ResumeListItem):
    extracted_text: str
    info: ResumeInfo
