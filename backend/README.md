# Study Assistant Backend

FastAPI backend foundation for accounts and private study projects. It uses synchronous SQLAlchemy 2, PostgreSQL, Alembic migrations, Argon2 password hashes, and JWT bearer access tokens. Document upload and RAG features are not included.

## Requirements and setup

- Python 3.11 or newer
- PostgreSQL 14 or newer

From this directory, create and activate a virtual environment, then install the root-level requirements:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ..\requirements.txt
```

Create a PostgreSQL database and role using your local PostgreSQL tools. For example, from `psql` as an administrator:

```sql
CREATE ROLE study_assistant WITH LOGIN PASSWORD 'choose-a-local-password';
CREATE DATABASE study_assistant OWNER study_assistant;
```

The example environment file is at the repository root. If `backend/.env` does not already exist, copy `..\.env.example` to `.env` from this directory; otherwise edit the existing file without replacing it. Set `DATABASE_URL` to a SQLAlchemy Psycopg URL such as `postgresql+psycopg://study_assistant:choose-a-local-password@localhost:5432/study_assistant`. Generate a unique `JWT_SECRET_KEY` for this environment; do not use the test key or commit `.env`. Keep `JWT_ALGORITHM=HS256`, set token lifetime as desired, and configure comma-separated `CORS_ORIGINS` if the client origin differs from the example.

## Database migrations

Run Alembic from `backend/` with the virtual environment active and `.env` configured:

```powershell
alembic upgrade head
```

To create a future migration after changing SQLAlchemy models:

```powershell
alembic revision --autogenerate -m "describe schema change"
```

Review generated revisions before applying them. Migrations create the schema; the application does not call `create_all()` at startup.

## Start the API

```powershell
uvicorn app.main:app --reload
```

The interactive API documentation is at `http://127.0.0.1:8000/docs`; health check is `GET /health`.

## Endpoints

- `POST /api/auth/register` — JSON `{ "username", "email", "password" }`; returns public user fields.
- `POST /api/auth/login` — OAuth2 form fields `username` (the account email) and `password`; returns a bearer token.
- `GET /api/auth/me` — current authenticated user.
- `POST /api/projects/` — create a project `{ "name", "description"? }`.
- `GET /api/projects/` — list the current user's projects.
- `GET /api/projects/{project_id}` — read an owned project; other users' projects return 404.
- `DELETE /api/projects/{project_id}` — delete an owned project; other users' projects return 404.

Project routes and `/api/auth/me` require `Authorization: Bearer <access_token>`. Registration returns 409 for duplicate username or email; login returns 401 for invalid credentials.

## Tests

The pytest suite uses a separate in-memory SQLite database and a test-only JWT secret. It does not connect to PostgreSQL or the configured development database:

```powershell
python -m pytest
```
