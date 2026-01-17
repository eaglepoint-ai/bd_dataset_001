FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy all project files
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set Python path to include both repositories
ENV PYTHONPATH=/app/repository_after:/app/repository_before:$PYTHONPATH

# Default command: run tests
CMD ["pytest", "tests", "-v", "--tb=short"]
