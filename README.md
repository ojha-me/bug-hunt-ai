# BugHunt AI

Interactive platform to learn coding and system design by actually building and fixing things. Instead of watching tutorials, you work through real problems with an AI tutor that explains, challenges, and reviews your work.

This started as a bug hunting tutor and grew into a fuller learning app with structured paths, interview prep, and system design practice.

## What it does

**Two ways to learn:**

1. **Learning Paths** - Pick a topic like JavaScript Fundamentals or Python Basics. The app creates a path with subtopics, each with clear objectives. You chat with the tutor, see live code examples, and get marked as you go. You can skip a subtopic if you already know it or go back to review.

2. **General Chat** - Just ask anything. For example "explain closures" or "show me a React hook". You get an explanation plus an editable code block. The tutor will then give you a small broken function to fix. You edit it in the Monaco editor, run it, and get feedback on correctness and edge cases.

**Other areas:**

- **Coding Problems** - 54 problems across lists like Blind 75, Easy Warm-ups, DP Ladder. Each has an editor, test runner, and AI hint or review.
- **Mock Interview** - Timed sessions that pull random problems.
- **Behavioral Prep** - Common interview questions with STAR guidance.
- **System Design** - Courses with lessons, a whiteboard to draw architecture, and guided drills. The whiteboard uses React Flow. You can drag components, connect them, double click to rename, and ask the AI to review the diagram. Lessons have a chat panel and a separate whiteboard drawer so things do not feel cramped.
- **Revision and Notes** - Review queue for due items and a notes system where you highlight text in a lesson and save a note. Works per learning path and globally.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite, Mantine UI, Monaco Editor, React Flow for diagrams, TanStack Query
- **Backend:** Python 3.11, Django + Django Ninja for REST, Django Channels for WebSockets
- **AI:** Groq API with qwen/qwen3.8-27b. Prompts are split into a shared base prompt plus specific parts for each tutor. Responses are forced to JSON and validated, with fallback handling for bad output.
- **Execution:** Sandboxed Docker containers per run. Each run is limited to 128MB, 0.5 CPU, no network, read only filesystem. Output is capped to 2000 chars.
- **Auth:** JWT access and refresh tokens. Refresh token in httpOnly cookie. Google OAuth optional.
- **DB:** Postgres, with Redis optional for Channels in production. Locally it falls back to in-memory.
- **Tooling:** uv for Python, yarn for frontend, Docker Compose for local dev

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node 20 and yarn 4 if you want to run the frontend outside Docker
- A Groq API key

### Environment

Create these files from the samples:

- `backend/.env` - needs `GROQ_API_KEY`, `JWT_SECRET_KEY`, and optionally `GOOGLE_OAUTH_CLIENT_ID` and `GROQ_MODEL`
- `.env.db` - needs `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `frontend/.env` - needs `VITE_API_BASE` and `VITE_WS_BASE` (defaults to local ports)

Example for local:

```
# backend/.env
GROQ_API_KEY=gsk_...
JWT_SECRET_KEY=some-random-string
GOOGLE_OAUTH_CLIENT_ID=

# .env.db
POSTGRES_DB=bughunt
POSTGRES_USER=bughunt
POSTGRES_PASSWORD=bughunt_dev_password

# frontend/.env
VITE_API_BASE=/api/
VITE_WS_BASE=http://localhost:5175
```

### Run with Docker (recommended)

We use a local compose file that maps to different ports so it does not clash:

```bash
docker compose -f docker-compose.local.yml up -d
# frontend on http://localhost:5175
# backend on http://localhost:8003
# db on 5433
```

Or the default compose:

```bash
docker compose up -d
# frontend 5173, backend 8000
```

Frontend in dev mode with hot reload:

```bash
docker compose -f docker-compose.override.yml up -d
# frontend on 5174
```

### Run without Docker

```bash
# backend
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver

# frontend
cd frontend
yarn install
yarn dev
```

## Seed data

The repo ships with seed commands. On a fresh DB:

```bash
docker exec bughunt_backend python manage.py seed_problems
docker exec bughunt_backend python manage.py seed_problem_lists
docker exec bughunt_backend python manage.py seed_sd_foundations
docker exec bughunt_backend python manage.py seed_sd_curriculum
docker exec bughunt_backend python manage.py seed_sd_case_studies
docker exec bughunt_backend python manage.py seed_interview_case_studies
```

Current counts in this repo: 54 coding problems, 5 problem lists, 3 learning topics, 2 system design courses with 14 lessons, and 14 case studies.

Note: `create_sample_topics` needs a user to own the topic and will fail on a clean DB. The other seeds cover the same content.

## Project structure

```
frontend/src/
  components/   # Sidebar, PathDetails, SDLabs, whiteboard, chat, etc.
  hooks/        # WebSocket hooks, speech to text
  api/          # apiClient, learningPaths, systemDesign, challenges
  contexts/     # SidebarContext
  types/        # generated api_types
backend/
  users/        # auth, JWT, Google OAuth
  ai_core/      # general chat, prompts, groq client, WebSocket consumers
  learning_paths/ # topics, subtopics, progress, notes
  challenges/   # problems, attempts, tutor
  system_design/ # courses, lessons, case studies, practice drills
  execution/    # Docker sandbox for Python
  revision/     # review queue
```

Key files if you are new to the codebase:

- `frontend/src/components/Sidebar.tsx` - nested groups for Coding, System Design, Prep and Review, with Recent on top
- `frontend/src/components/SDLearningRoom.tsx` - chat first layout with whiteboard as a drawer
- `backend/ai_core/utils/base_prompt.py` - shared prompt rules used by all tutors
- `backend/ai_core/utils/groq_llm.py` - Groq wrapper with JSON mode and streaming support
- `backend/bug_hunt_project/settings.py` - env gated for SECRET_KEY, DEBUG, CORS and secure cookies

## How it runs locally

- Frontend build is `tsc -b && vite build` and served by Nginx in prod. Dev uses Vite directly.
- Backend uses Daphne/Uvicorn with Channels. In dev it runs with reload, in prod you would switch to Redis channel layer by setting `REDIS_URL`.
- Code execution spawns `python:3.11-slim` containers with limits. This needs `/var/run/docker.sock` mounted, which works locally and on a VM but not on shared PaaS like Render free. For a hosted demo we fall back to a subprocess or an external service.

## Current status

Working on polish before a wider release. What is done:

- Sidebar redesign with collapsible groups and recent pages that persist in localStorage
- System design whiteboard now uses a drawer so the chat has room. Progress badges collapse to a summary.
- Prompts deduped to a shared base, Groq calls use JSON mode with validation, model is env configurable
- Security hardening for settings and auth, IDOR fixes for conversations, secure cookies, and cleanup of debug logs
- Seed data for problems and system design is in place

What is still pending:

- Full test coverage
- Billing and deployment hardening for prod
- Better speech to text (currently browser Web Speech API, we plan to switch to a Whisper based option)

## Notes for contributors

- Frontend lint: `yarn lint` in `frontend/`
- Backend checks: `python -m py_compile` and `python manage.py check`
- Keep prompts in `base_prompt.py` when adding a new tutor so style stays consistent

If you are trying this for the first time, start with `docker compose -f docker-compose.local.yml up -d`, create an account at `http://localhost:5175/login`, and open a learning path from Topics.

