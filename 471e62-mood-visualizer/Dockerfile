FROM node:20-slim

# Install Python for evaluation
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY . /app

# Install dependencies for repository_after
WORKDIR /app/repository_after
RUN npm install

# Default command runs evaluation
WORKDIR /app
CMD ["python3", "evaluation/evaluation.py"]
