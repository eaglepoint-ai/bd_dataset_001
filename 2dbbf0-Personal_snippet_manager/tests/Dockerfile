FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install test and backend dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-playwright \
    requests \
    sqlalchemy \
    fastapi \
    httpx \
    pydantic-settings \
    python-dotenv \
    psycopg2-binary \
    uvicorn \
    pydantic

# Pre-install browsers
RUN playwright install chromium

# Copy the tests directory
COPY ./tests /app/tests

# Copy the evaluation directory
COPY ./evaluation /app/evaluation

# Copy the backend code (needed for imports in backendTest.py)
COPY ./repository_after/backend /app/repository_after/backend

CMD ["python", "evaluation/evaluation.py"]
