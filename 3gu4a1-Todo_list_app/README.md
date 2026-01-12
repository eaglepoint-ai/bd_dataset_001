# Todo List App

A FastAPI-based Todo List application with in-memory storage, designed for high performance and ready for database migration.

## Features

- RESTful API with full CRUD operations
- High-performance in-memory storage (optimized for 100k+ todos)
- Pydantic v2 models for request/response validation
- Comprehensive test suite
- Docker and Docker Compose support

## Project Structure

```
.
├── repository_after/     # Main application code
│   ├── app/              # Application modules
│   │   ├── api/          # API routes
│   │   ├── core/         # Core configuration
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── storage/      # Storage layer (in-memory)
│   └── main.py          # FastAPI application entry point
├── repository_before/    # Before state (if applicable)
├── tests/                # Test suite
├── evaluation/           # Evaluation scripts
│   ├── evaluation.py    # Evaluation script
│   └── reports/         # Evaluation reports
├── Dockerfile           # Docker image definition
└── docker-compose.yml   # Docker Compose configuration
```

## Docker Usage

### Build and start all services

```bash
docker-compose up --build
```

This will start:
- **repository_after** service on port 8000
- **repository_before** service on port 8001 (if it has content)
- **tests** service (runs pytest)

### Run only repository_after

```bash
docker-compose up repository_after
```

### Run only tests

```bash
docker-compose up tests
```

### Run in detached mode

```bash
docker-compose up -d
```

## API Endpoints

Once the service is running, the API will be available at:

- **Health Check**: `GET /health`
- **List Todos**: `GET /todos?offset=0&limit=100`
- **Get Todo**: `GET /todos/{todo_id}`
- **Create Todo**: `POST /todos`
- **Update Todo**: `PUT /todos/{todo_id}`
- **Patch Todo**: `PATCH /todos/{todo_id}`
- **Delete Todo**: `DELETE /todos/{todo_id}`

### API Documentation

When the service is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Prerequisites

- Python 3.13+
- uv (Python package manager)
- Docker and Docker Compose

### Local Development Setup

1. Install dependencies:
```bash
uv sync
```

2. Run the application:
```bash
cd repository_after
uv run uvicorn main:app --reload
```

3. Run tests:
```bash
uv run pytest tests/ -v
```

4. Format code:
```bash
ruff format .
```

5. Check code formatting:
```bash
ruff format --check .
```

## Testing

The test suite includes:
- Health check tests
- CRUD operation tests
- Edge case tests (empty titles, nonexistent todos, pagination, etc.)

Run tests with:
```bash
docker-compose up tests
```

Or locally:
```bash
uv run pytest tests/ -v
```

## Evaluation

Run the evaluation script to compare `repository_before` and `repository_after`:

```bash
python3 evaluation/evaluation.py
```

This will:
- Run tests on both repositories
- Generate a comparison report
- Write the report to `evaluation/reports/report.json`
- Exit with code 0 (success) or 1 (failure)

The evaluation report includes:
- Test results for both repositories
- Comparison and improvement summary
- Environment metadata
- Run duration and timestamps

## License

MIT
