# ResumeIQ: AI-Powered Job Application & Resume Analyzer

Full-stack app: upload a resume (PDF/DOCX), paste a job description, get an AI match analysis
(score, matching/missing skills, suggestions), chat with an AI resume assistant, and track applications.

**Stack:** React 18 · TypeScript · Vite · Tailwind · React Router · Axios · Recharts · React Hook Form |
FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic · JWT · PostgreSQL | LLM via a provider abstraction (Anthropic implemented) | pytest · Vitest

> AI scores are **estimates** to help improve a resume. They are not predictions of hiring decisions (shown in the UI on every report).

## Architecture

```
React (Vite) --JWT/JSON--> FastAPI routers (HTTP only)
                               -> services (business logic, ownership checks)
                                    -> SQLAlchemy models -> PostgreSQL
                                    -> LLMProvider (abstract) -> Anthropic | Mock (tests)
```

- **Routers** are thin; **services** hold logic and are testable without HTTP.
- **Ownership** is enforced inside every query (`WHERE id = ? AND user_id = current_user.id`), so other users' rows return 404.
- **LLM output is untrusted:** parsed, validated with Pydantic (`AnalysisResult`), retried once, else a clean 502.
- **Prompt injection hygiene:** resume/job text is wrapped in tags and the system prompt says to treat it as data.
- **Agent:** the assistant runs a tool-calling loop (`get_job_description`, `get_latest_analysis`). Tools take no IDs from the model; they are bound to the already-verified resume/job.
- **Privacy:** only extracted text is stored (not the original file); resume text is never logged.

```
backend/app/{core,db,models,schemas,api/routes,services,ai/{base,factory,prompts,providers}}  backend/tests  backend/alembic
frontend/src/{api,context,hooks,types,components/{layout,ui,charts},pages,__tests__}
```

## Run locally

Prerequisites: Python 3.11+, Node 18+, Docker (for PostgreSQL).

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then set SECRET_KEY and ANTHROPIC_API_KEY
alembic upgrade head
uvicorn app.main:app --reload                           # http://localhost:8000/docs

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                                             # http://localhost:5173
```

No API key yet? Set `LLM_PROVIDER=mock` in `backend/.env` to get canned responses for UI development only.

## Tests

```bash
cd backend && pytest -q          # 29 tests: auth, uploads/parsing, ownership, analysis (mocked LLM), tracker, assistant, dashboard
cd frontend && npm test          # components, route protection, form validation
cd frontend && npm run build     # typecheck + production build
```
Backend tests use in-memory SQLite and a `MockLLMProvider`, so they need no Postgres or API key.

## API summary (all under `/api`, JWT bearer except register/login)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me` |
| Resumes | `POST /resumes/upload`, `GET /resumes`, `GET/DELETE /resumes/{id}` |
| Jobs | `POST/GET /jobs`, `GET/DELETE /jobs/{id}` |
| Analysis | `POST /analysis/analyze`, `GET /analysis/history`, `GET/DELETE /analysis/{id}` |
| Assistant | `POST /assistant/chat` |
| Applications | `POST/GET /applications` (`?status=`), `PATCH/DELETE /applications/{id}`, `POST /applications/{id}/notes`, `DELETE /applications/{id}/notes/{note_id}` |
| Dashboard | `GET /dashboard/summary` |

## Security checklist

bcrypt password hashing · JWT with expiry · extension + file-signature + size validation · secrets only in env vars ·
API key never reaches the browser · explicit CORS origins · generic login errors · no resume text in logs · ownership on every query.
Known trade-off: the JWT is kept in `localStorage` (simple, but exposed to XSS). A production hardening step is an httpOnly cookie plus CSRF protection.

## Deployment (one reasonable setup)

- **Database:** managed PostgreSQL (Neon, Supabase, Render, RDS). Set `DATABASE_URL`.
- **Backend:** deploy `backend/` to Render/Railway/Fly.io. Build: `pip install -r requirements.txt`. Pre-start: `alembic upgrade head`.
  Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Env: `DATABASE_URL`, `SECRET_KEY` (long random), `ANTHROPIC_API_KEY`,
  `CORS_ORIGINS=https://your-frontend-domain`, `LLM_PROVIDER=anthropic`.
- **Frontend:** deploy `frontend/` to Vercel/Netlify. Build `npm run build`, output `dist`, env `VITE_API_URL=https://your-api-domain/api`.
  Add an SPA rewrite so all paths serve `index.html`.
- Serve both over HTTPS. Add rate limiting (e.g. `slowapi`) on login and `/analysis/analyze` before going public, since each analysis costs money.

## Interview talking points

Layered architecture · provider abstraction + mocks · validating LLM JSON · IDOR prevention · JSONB for evolving AI output ·
`model_name` + `prompt_version` stored per analysis · tool-calling agent with server-bound tool scope · Alembic migrations.
