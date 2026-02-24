# Chatbot

Minimal full-stack chatbot project (Django backend + Vite + React frontend).

**Tech stack:** Django 6, Django REST Framework, SimpleJWT, Vite, React 19, Tailwind

**Contents:**
- `backend/` — Django project and REST API
- `frontend/` — Vite + React frontend

## Quick start

Prerequisites:
# Chatbot — Detailed README

This repository contains a full-stack chatbot application with a Django REST API backend and a Vite + React frontend. It is a developer-focused starter that demonstrates how to connect a conversational UI to multiple AI providers (OpenAI, Gemini, Claude).

## Key technologies

- Backend: Django 6, Django REST Framework, SimpleJWT (JWT auth), django-cors-headers
- Frontend: React 19, Vite, Tailwind CSS (present in dependencies)
- AI integrations: optional API keys supported for OpenAI, Gemini, and Claude

## Repository layout

- `backend/` — Django project and local apps (`authentication`, `chat`, `api`)
	- `backend/backend/settings.py` — main settings (reads environment variables via `python-dotenv`)
	- `backend/manage.py` — Django management CLI
	- `backend/db.sqlite3` — development SQLite database (gitignored)
- `frontend/` — Vite + React app (UI, components, pages)

## High-level architecture

- The frontend communicates with the backend using REST APIs. The backend handles authentication (JWT), message persistence, and calls out to configured AI providers to generate responses. The `chat` app encapsulates business logic for conversation handling; `authentication` provides dev-friendly auth middleware and token endpoints.

## Prerequisites

- Python 3.11+ (use a virtual environment)
- Node.js 18+ and npm or yarn
- Git

## Environment variables and examples

Create a `.env` file at the repo root (or set vars in your environment). The project loads `.env` automatically.

Example `.env` for development:

```ini
DJANGO_SECRET_KEY=replace-with-a-secure-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GEMINI_API_KEY=
OPENAI_API_KEY=
CLAUDE_API_KEY=
AUTH_DISABLED=True
```

Environment variable descriptions

- `DJANGO_SECRET_KEY`: required for cryptographic signing — use a secure random string in production.
- `DEBUG`: `True` in development; set to `False` in production.
- `ALLOWED_HOSTS`: comma-separated hostnames allowed by Django.
- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`: provider keys for AI integrations.
- `AUTH_DISABLED`: when `True`, the custom dev auth middleware bypasses normal authentication for easier local development.

## Backend — setup & commands

1. Create and activate a virtual environment:

```bash
python -m venv .env
source .env/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Apply migrations and create a superuser:

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

4. Run the dev server:

```bash
python manage.py runserver
```

Other useful Django commands

- `python manage.py shell` — open Django shell
- `python manage.py loaddata <fixture>` — load fixtures
- `python manage.py collectstatic` — gather static files for production

Notes

- The default database is SQLite at `backend/db.sqlite3`. For production, set `DATABASES` to use Postgres or MySQL.
- Media uploads are stored at `backend/media/` by default (`MEDIA_ROOT`). In production, prefer object storage (S3/GCS).

## Frontend — setup & commands

From the repo root:

```bash
cd frontend
npm install
npm run dev    # start Vite dev server
npm run build  # build for production
npm run preview
```

Place any frontend-specific environment variables in `frontend/.env` following Vite conventions.

## API surface (development)

The backend exposes REST endpoints. Typical routes in development include (confirm exact paths in `backend/urls.py` and app `urls.py`):

- `POST /api/auth/login/` — authenticate and receive JWT tokens (if enabled)
- `POST /api/auth/refresh/` — refresh the access token
- `GET /api/chat/` — list conversation messages (requires auth)
- `POST /api/chat/` — send a message; backend will forward request to configured AI provider, persist the response, and return it

Check `api/views.py`, `chat/views.py`, and `authentication/views.py` for payload formats and additional endpoints.

## Authentication

- JWT via `djangorestframework_simplejwt`. Requests should include `Authorization: Bearer <access_token>` header for protected endpoints.
- For local development, `AUTH_DISABLED=True` may be used to bypass auth checks.

## AI provider integration

- The app supports multiple AI providers. Keys are read from environment variables. Provider selection and request formatting are implemented in `chat/services.py` and `chat/utils.py`.
- If you add another provider, include its key in `.env` and extend the provider selector in the backend service layer.

## Testing & linting

- Backend tests: `cd backend && python manage.py test`
- Frontend lint: `cd frontend && npm run lint`

## Common git-ignored files

- Python: `__pycache__/`, `*.pyc`, `.venv/`, `env/`
- Node: `node_modules/`, `dist/`
- Local env files: `.env`, `.env.*`
- Editors: `.vscode/`, `.idea/`, `.DS_Store`

## Troubleshooting

- Missing secret key error: set `DJANGO_SECRET_KEY` in `.env` or export it in your shell.
- CORS errors: confirm the frontend origin and `CORS_ALLOW_ALL_ORIGINS` setting in `backend/backend/settings.py`.
- AI provider errors: verify API key validity and network access.

## Production notes

- Set `DEBUG=False` and supply a secure `DJANGO_SECRET_KEY`.
- Configure a production-grade database (Postgres recommended) and persistent object storage for media.
- Serve static files via a CDN or use `collectstatic` + WhiteNoise for a simple deployment.
- Use HTTPS and configure `ALLOWED_HOSTS`.

## Contributing

1. Fork the repository and create a feature branch.
2. Run tests and linters locally before opening a PR.
3. Provide clear testing instructions in your PR description.

## License

This repository has no license file yet. Add a `LICENSE` (e.g., MIT) to make the code explicitly reusable.

---
