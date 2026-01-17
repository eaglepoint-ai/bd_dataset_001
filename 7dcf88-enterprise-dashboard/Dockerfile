FROM python:3.11-slim
WORKDIR /app

# Install Node.js for the test runner
RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY . /app
CMD ["python3", "evaluation/evaluation.py"]
