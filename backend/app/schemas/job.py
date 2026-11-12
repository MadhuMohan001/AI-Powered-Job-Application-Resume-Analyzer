from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    company: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=30, max_length=20000)


class JobOut(JobCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
