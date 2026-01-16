# Personal Snippet Manager

A containerized fullstack application for managing code snippets, featuring a FastAPI backend and a React (Vite) frontend.

## Folder layout
- `repository_after/`: The complete implementation (Backend + Frontend).
- `tests/`: Automated test suite covering backend and frontend requirements.
- `evaluation/`: Evaluation scripts and generated reports.
- `docker-compose.yml`: Orchestration for services, testing, and evaluation.

## Run with Docker

### Build images
```bash
docker compose build
```

### Run tests
Run the full automated test suite (Backend + Frontend):
```bash
docker compose up --build --exit-code-from test-runner test-runner
```
**Expected behavior:**
- Functional tests (Backend): ✅ PASS
- Functional tests (Frontend): ✅ PASS

### Run evaluation
Run the standardized evaluation script to generate a compliance report:
```bash
docker compose up --build --exit-code-from eval-runner eval-runner
```
**This will:**
1. Wait for services (DB, Backend, Frontend) to be ready.
2. Run all tests within the `eval-runner` container.
3. Generate a report at `evaluation/reports/latest.json`.

### Run evaluation with custom output file
You can override the default report path using CLI arguments:
```bash
docker compose run --rm eval-runner python evaluation/evaluation.py --output /app/evaluation/reports/custom_report.json
```

## Local Development (Non-Docker)
If you prefer running components manually:

### Backend
1. `cd repository_after/backend`
2. `pip install -r requirements.txt`
3. `uvicorn app.main:app --reload`

### Frontend
1. `cd repository_after/frontend/personalsnippetmanager`
2. `npm install`
3. `npm run dev`
