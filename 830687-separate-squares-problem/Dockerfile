FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . /app

# Ensure evaluation/reports directory exists
RUN mkdir -p /app/evaluation/reports

# Default command: run evaluation
CMD ["python", "evaluation/evaluation.py"]
