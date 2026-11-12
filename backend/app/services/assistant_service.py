"""AI resume assistant with a small tool-calling agent."""
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.base import LLMProvider
from app.ai.prompts import ASSISTANT_SYSTEM, MAX_TEXT_CHARS
from app.models import ResumeAnalysis, User
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.resume_service import get_owned_job, get_owned_resume

TOOLS = [
    {
        "name": "get_job_description",
        "description": "Get the job title, company and description the user is targeting.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_latest_analysis",
        "description": "Get the latest saved match analysis (score, matching and missing skills, suggestions) "
        "for this resume and job.",
        "input_schema": {"type": "object", "properties": {}},
    },
]


def chat(db: Session, user: User, llm: LLMProvider, req: ChatRequest) -> ChatResponse:
    resume = get_owned_resume(db, user, req.resume_id)
    job = get_owned_job(db, user, req.job_id) if req.job_id else None

    def handle_tool(name: str, _args: dict) -> str:
        # Tools take NO ids from the model: they are bound to the already-verified resume/job,
        # so the model can never reach another user's data.
        if not job:
            return "No job description is selected. Ask the user to choose one."
        if name == "get_job_description":
            return f"Title: {job.title}\nCompany: {job.company}\n\n{job.description[:MAX_TEXT_CHARS]}"
        if name == "get_latest_analysis":
            latest = db.scalar(
                select(ResumeAnalysis)
                .where(
                    ResumeAnalysis.user_id == user.id,
                    ResumeAnalysis.resume_id == resume.id,
                    ResumeAnalysis.job_id == job.id,
                )
                .order_by(ResumeAnalysis.created_at.desc(), ResumeAnalysis.id.desc())
            )
            return json.dumps(latest.result) if latest else "No analysis exists yet for this resume and job."
        return "Unknown tool."

    system = ASSISTANT_SYSTEM.format(resume_text=resume.extracted_text[:MAX_TEXT_CHARS])
    messages = [m.model_dump() for m in req.history[-10:]] + [{"role": "user", "content": req.message}]
    reply, used = llm.chat(system, messages, tools=TOOLS, tool_handler=handle_tool)
    return ChatResponse(reply=reply, tools_used=used)
