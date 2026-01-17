FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project structure
COPY . /app

# Set PYTHONPATH to include repository directories
ENV PYTHONPATH=/app

# Default command (can be overridden)
CMD ["python", "-m", "pytest", "-v", "--tb=short"]
