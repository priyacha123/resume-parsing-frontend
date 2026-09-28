# ResumeMatch Frontend

Next.js frontend for the ResumeMatch resume and job-description analysis application.

## Setup

```powershell
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Run the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Commands

```powershell
npm run lint
npm run build
npm run start
```

## Configuration

`NEXT_PUBLIC_API_URL` must point to the backend API, including the `/api` suffix:

```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api
```

The frontend stores JWT session tokens in root-scoped browser cookies, refreshes expired access tokens, and calls the backend logout endpoint when the user signs out.

## Dashboard flow

1. Sign in or create an account.
2. Upload a PDF, DOCX, or TXT resume.
3. Paste or save a job description.
4. Select TF-IDF, semantic embedding, or hybrid matching.
5. Review the score, missing keywords, matched proficiencies, recommendations, and two project ideas.

## Render deployment

Create a separate Render Web Service using this directory as the root:

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`

The backend must allow the frontend deployment URL in its `CORS_ALLOWED_ORIGINS` setting.
