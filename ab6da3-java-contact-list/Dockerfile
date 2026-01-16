FROM python:3.11-slim

WORKDIR /app

# Java toolchain for compiling/running Contacts.java in tests
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jdk-headless ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python test/eval deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy all task files
COPY . /app

# Default command runs evaluation (before+after+report)
CMD ["python", "evaluation/evaluation.py"]
