"""initial schema

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

STATUS = postgresql.ENUM("applied", "shortlisted", "interview", "rejected", "offered",
                         name="application_status", create_type=False)


def upgrade() -> None:
    STATUS.create(op.get_bind(), checkfirst=True)
    ts = lambda: sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)  # noqa: E731

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        ts(),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "resumes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(10), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("extracted_text", sa.Text, nullable=False),
        ts(),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])

    op.create_table(
        "job_descriptions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        ts(),
    )
    op.create_index("ix_job_descriptions_user_id", "job_descriptions", ["user_id"])

    op.create_table(
        "resume_analyses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_id", sa.Integer, sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer, sa.ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("match_score", sa.SmallInteger, nullable=False),
        sa.Column("result", postgresql.JSONB, nullable=False),
        sa.Column("model_name", sa.String(100), nullable=False),
        sa.Column("prompt_version", sa.String(20), nullable=False),
        ts(),
        sa.CheckConstraint("match_score BETWEEN 0 AND 100", name="ck_match_score_range"),
    )
    op.create_index("idx_analyses_user", "resume_analyses", ["user_id", "created_at"])

    op.create_table(
        "job_applications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer, sa.ForeignKey("job_descriptions.id", ondelete="SET NULL")),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("position", sa.String(200), nullable=False),
        sa.Column("status", STATUS, nullable=False, server_default="applied"),
        sa.Column("applied_on", sa.Date),
        sa.Column("interview_date", sa.DateTime(timezone=True)),
        ts(),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_applications_user", "job_applications", ["user_id", "status"])

    op.create_table(
        "application_notes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("application_id", sa.Integer, sa.ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        ts(),
    )
    op.create_index("ix_application_notes_application_id", "application_notes", ["application_id"])


def downgrade() -> None:
    for table in ("application_notes", "job_applications", "resume_analyses", "job_descriptions", "resumes", "users"):
        op.drop_table(table)
    STATUS.drop(op.get_bind(), checkfirst=True)
