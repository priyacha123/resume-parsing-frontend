# Resume & Job Automation

A full-stack resume analysis application that parses resumes, compares them with job descriptions, calculates match scores, and generates model-specific tailoring recommendations.

## Features

- Upload and parse PDF, DOCX, and TXT resumes.
- Save job descriptions with optional title and company metadata.
- Calculate resume-to-job match scores using:
  - **Exact Keywords (TF-IDF):** prioritizes ATS vocabulary and exact term overlap.
  - **Semantic AI (Embeddings):** evaluates conceptual relevance, role scope, and experience depth.
  - **Smart Hybrid:** combines semantic similarity with keyword matching.
- Generate:
  - Tailored optimization recommendations.
  - Matched proficiencies.
  - Missing keywords and skill gaps.
  - Model-specific portfolio project ideas.
- Authenticate users with JWT access and refresh tokens.
- Store embeddings for resumes and job descriptions using PostgreSQL with `pgvector`.
- Run asynchronous tasks with Celery and Redis.

## Project Structure

```text
resume-parsing/
├── job-automation-backend/     # Django REST API, matching, parsing, and AI services
│   ├── config/                 # Django project configuration
│   ├── core/                   # Models, API views, matching, parsing, and tailoring
│   ├── manage.py
│   ├── requirements.txt
│   └── docker-compose.yml
└── job-automation-frontend/    # Next.js dashboard and authentication UI
    ├── src/app/
    ├── src/components/
    ├── src/lib/
    └── package.json
```

## Requirements

- Python 3.13+
- Node.js and npm
- PostgreSQL with the `pgvector` extension
- Redis for Celery and asynchronous processing
- Optional API credentials:
  - Hugging Face token for embedding generation.
  - Gemini API key for AI-generated tailoring recommendations.

## Backend Setup

Open PowerShell in the backend directory:

```powershell
cd job-automation-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create or update `job-automation-backend\.env` with values appropriate for your environment:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
DATABASE_URL=postgresql://username:password@localhost:5432/resume_automation
REDIS_URL=redis://localhost:6379/0
HF_API_TOKEN=your-hugging-face-token
GEMINI_API_KEY=your-gemini-api-key
WEBHOOK_SECRET=replace-with-a-webhook-secret
```

Never commit real credentials or production secrets.

Run migrations and start the API:

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver
```

The development API is available at `http://127.0.0.1:8000/api/`.

### Backend with Docker Compose

The backend includes services for the web application, Celery worker, Redis, and Nginx:

```powershell
cd job-automation-backend
docker compose up --build
```

Configure the database and external service variables in the backend `.env` file before starting the stack.

## Frontend Setup

Open a second PowerShell window:

```powershell
cd job-automation-frontend
npm install
```

Create `job-automation-frontend\.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Start the Next.js development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

All API routes are prefixed with `/api/`.

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| POST | `/auth/register/` | Register a user | No |
| POST | `/auth/login/` | Obtain JWT access and refresh tokens | No |
| POST | `/auth/refresh/` | Refresh an access token | No |
| POST | `/resumes/upload/` | Upload and parse a resume | Yes |
| GET | `/resumes/` | List the current user's recent resumes | Yes |
| POST | `/job-descriptions/` | Create a job description | Yes |
| GET | `/job-descriptions/` | List the current user's job descriptions | Yes |
| POST | `/match/` | Calculate a match and generate recommendations | Yes |
| GET | `/matches/` | List recent match results | Yes |
| GET | `/tasks/<task_id>/` | Check an asynchronous task | Yes |
| GET | `/webhook/match/<match_id>/` | Retrieve a signed match result | Signature |

Example match request:

```json
{
  "resume_id": 1,
  "job_description_id": 1,
  "method": "hybrid"
}
```

Supported `method` values are `tfidf`, `embedding`, and `hybrid`.

## Matching and Recommendation Flow

1. The resume parser extracts text from the uploaded file.
2. The selected scoring model calculates the match percentage.
3. Resume and job-description embeddings are generated and cached when required.
4. The tailoring service evaluates the resume from the selected model's perspective.
5. The API returns the score, missing keywords, matched proficiencies, recommendations, and project ideas.

The recommendation emphasis changes by model:

| Model | Primary emphasis |
| --- | --- |
| TF-IDF | Exact keywords, ATS vocabulary, technical tools, and terminology placement |
| Embedding | Semantic fit, seniority, architecture, problem-solving depth, and outcomes |
| Hybrid | A combined view of ATS keyword coverage and recruiter-facing narrative quality |

## Testing

Backend tests:

```powershell
cd job-automation-backend
.\venv\Scripts\python.exe manage.py test
```

Frontend validation:

```powershell
cd job-automation-frontend
npm run lint
npm run build
```

The backend test suite requires a working test database connection. If PostgreSQL reports that the configured test database already exists, remove or reuse that test database according to your local database setup before rerunning the tests.

## Security Notes

- Keep `.env` and `.env.local` files out of version control.
- Use a strong `DJANGO_SECRET_KEY` and `WEBHOOK_SECRET` in deployed environments.
- Keep `DEBUG=False` in production.
- Restrict CORS origins to trusted frontend domains.
- Do not expose uploaded resume files or API credentials publicly.
