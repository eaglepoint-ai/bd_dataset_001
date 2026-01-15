FROM python:3.11-slim

WORKDIR /app

# Copy everything
COPY . /app

# Install dependencies (if requirements.txt exists)
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Default command (can be overridden)
CMD ["python", "--version"]
