FROM python:3.11-slim

WORKDIR /app

# Copy project files
COPY repository_before/ /app/repository_before/
COPY repository_after/ /app/repository_after/
COPY tests/ /app/tests/
COPY evaluation/ /app/evaluation/
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create directory for evaluation reports
RUN mkdir -p /app/evaluation/reports

# Default command (can be overridden in docker-compose)
CMD ["python3", "evaluation/evaluation.py"]
