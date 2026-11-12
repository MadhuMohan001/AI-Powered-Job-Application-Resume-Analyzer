# ResumeIQ – AI-Powered Job Application & Resume Analyzer

<p align="center">
  <strong>An intelligent AI-powered platform to analyze resumes, identify skill gaps, and improve job application success.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Enabled-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Integrated-8A2BE2" />
</p>

## 📌 Overview

**ResumeIQ** is a full-stack AI-powered web application designed to help job seekers improve their resumes and better understand how their qualifications align with specific job requirements.

Users can upload their resumes, provide job descriptions, and receive AI-powered analysis containing estimated compatibility scores, matching skills, missing qualifications, and personalized improvement recommendations.

The platform also includes an AI Resume Assistant and a Job Application Tracker to help users manage their job search process efficiently.

The application combines modern frontend technologies, Python backend development, database management, and AI integration into one practical solution.

## ✨ Key Features

### 1. User Authentication
- Secure user registration and login.
- JWT-based authentication.
- Password hashing.
- Protected application routes.
- User-specific data access.

### 2. Resume Management
- Upload resumes in PDF and DOCX formats.
- Extract text from uploaded documents.
- View saved resumes.
- Manage and delete uploaded resumes.
- Secure resume ownership management.

### 3. AI-Powered Resume Analysis
- Analyze resumes against job descriptions.
- Generate an estimated resume-to-job match score.
- Identify matching skills.
- Detect missing skills and qualifications.
- Extract important job-related keywords.
- Analyze relevant experience.
- Generate personalized resume improvement suggestions.

### 4. AI Resume Assistant
- Interact with an AI-powered resume assistant.
- Ask questions about resume and job requirements.
- Get personalized improvement recommendations.
- Retrieve relevant job description and analysis information through AI tools.

### 5. Job Application Tracker
- Add and manage job applications.
- Track company names and job positions.
- Monitor application status.
- Maintain application notes.
- Organize job application history.

### 6. Dashboard & Analytics
- View resume and analysis statistics.
- Monitor job application progress.
- Access recent analyses.
- View application summaries.

### 7. Analysis History
- Save previous resume analyses.
- Review earlier analysis reports.
- Access historical recommendations.
- Manage saved analysis records.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| API Communication | Axios |
| Charts | Recharts |
| Forms | React Hook Form |
| Backend | Python, FastAPI |
| Validation | Pydantic |
| ORM | SQLAlchemy 2 |
| Database | PostgreSQL |
| Migrations | Alembic |
| Authentication | JWT |
| AI Integration | Anthropic API |
| Testing | Pytest, Vitest |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

The application follows a layered client-server architecture.

```text
                 USER
                   |
                   v
          REACT FRONTEND
          (TypeScript + Vite)
                   |
                   | HTTP / REST API
                   | JWT Authentication
                   v
           FASTAPI BACKEND
                   |
          +--------+--------+
          |        |        |
          v        v        v
       ROUTERS  SERVICES   AI LAYER
          |        |        |
          |        |        v
          |        |    ANTHROPIC API
          |        |
          +--------+
                   |
                   v
             SQLALCHEMY
                   |
                   v
              POSTGRESQL
```

### Architecture Highlights

- Modular backend architecture with separate API routers, services, schemas, and database models.
- Reusable React components and organized frontend services.
- Provider-based AI architecture for flexible LLM integration.
- Pydantic validation for AI-generated structured responses.
- User ownership checks to protect private application data.
- Database migrations managed through Alembic.

## 📂 Project Structure

```text
AI-Powered-Job-Application-Resume-Analyzer/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   ├── base.py
│   │   │   ├── factory.py
│   │   │   └── prompts.py
│   │   │
│   │   ├── api/
│   │   │   └── routes/
│   │   │
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   └── __tests__/
│   │
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

## ⚙️ Local Installation & Setup

Follow these instructions to run the project on your local machine.

### Prerequisites

Make sure you have installed:

- Python 3.11 or above
- Node.js 18 or above
- PostgreSQL or Docker Desktop
- Git
- VS Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/MadhuMohan001/AI-Powered-Job-Application-Resume-Analyzer.git

cd AI-Powered-Job-Application-Resume-Analyzer
```

### Step 2: Start PostgreSQL

Using Docker Compose from the project root:

```bash
docker compose up -d
```

### Step 3: Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the environment.

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file by copying `.env.example` to `.env`.

Configure your database connection, secret key, and AI provider credentials.

For AI integration, configure your Anthropic API key in the backend environment file.

If you want to test the application without an AI API key, configure the mock provider:

```env
LLM_PROVIDER=mock
```

Run database migrations:

```bash
alembic upgrade head
```

### Step 4: Start the Backend Server

```bash
uvicorn app.main:app --reload
```

Backend URL:

http://localhost:8000

Interactive API documentation:

http://localhost:8000/docs

### Step 5: Configure the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Create your environment file from `.env.example` and configure the API URL.

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

http://localhost:5173

### 🎉 Application Successfully Running!

Open http://localhost:5173 in your browser to access ResumeIQ.

## 🔌 API Endpoints

The backend exposes REST APIs for the following modules:

| Module | Endpoint |
|---|---|
| Authentication | `/api/auth/` |
| Resume Management | `/api/resumes/` |
| Job Descriptions | `/api/jobs/` |
| Resume Analysis | `/api/analysis/` |
| AI Assistant | `/api/assistant/` |
| Job Applications | `/api/applications/` |
| Dashboard | `/api/dashboard/` |

For complete endpoint details, visit:

http://localhost:8000/docs

## 🧪 Testing

### Backend Tests

Navigate to the backend directory:

```bash
pytest -q
```

Backend tests cover authentication, resume uploads, document parsing, user ownership, AI analysis, application tracking, and dashboard functionality.

AI integrations can be tested using the mock LLM provider.

### Frontend Tests

Navigate to the frontend directory:

```bash
npm test
```

Build verification:

```bash
npm run build
```

## 🔐 Security & Privacy

The application incorporates several security practices:

- Password hashing.
- JWT-based authentication with token expiration.
- Protected API endpoints.
- User-specific resource ownership validation.
- Resume file type and size validation.
- Environment-based secret management.
- Backend-only AI API key access.
- Input validation using Pydantic.
- Protection against unsafe AI prompt handling.
- Avoidance of sensitive resume content in application logs.

**Privacy note:** The application stores extracted resume text rather than the original uploaded file. Users should avoid uploading sensitive personal information to external AI services without understanding the provider's data policies.

## 🎯 Learning Outcomes

This project demonstrates practical experience in:

- Full-stack web application development.
- React component-based architecture.
- TypeScript development.
- Python backend development.
- FastAPI and REST API design.
- PostgreSQL database integration.
- SQLAlchemy ORM and Alembic migrations.
- JWT authentication and authorization.
- AI and LLM integration.
- AI agent tool calling.
- Structured AI response validation.
- File uploads and document processing.
- Unit testing and application debugging.
- Git and GitHub version control.

## 🚀 Future Enhancements

- Advanced semantic skill matching.
- Vector database integration for improved job matching.
- Resume template generation.
- PDF resume export.
- More AI provider integrations.
- Advanced analytics and reporting.
- Enhanced interview preparation assistant.

## ⚠️ Disclaimer

The resume match score and AI-generated recommendations are estimates intended to assist users in improving their resumes. They do not guarantee interviews, job offers, or hiring outcomes.

## 👨‍💻 Author

**Madhu Mohan**

Full Stack Developer | React | TypeScript | Python | FastAPI

GitHub: [@MadhuMohan001](https://github.com/MadhuMohan001)

Project Repository: [AI-Powered-Job-Application-Resume-Analyzer](https://github.com/MadhuMohan001/AI-Powered-Job-Application-Resume-Analyzer)

---

<p align="center">
  <strong>Built with ❤️ using React, Python, FastAPI, PostgreSQL, and AI.</strong>
</p>