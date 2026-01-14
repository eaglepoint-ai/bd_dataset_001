FROM node:20-alpine

# Install Python for evaluation script
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY . .

# Install dependencies for both repositories
WORKDIR /app/repository_before
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

WORKDIR /app/repository_after
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Make evaluation script executable
WORKDIR /app
RUN chmod +x evaluation/evaluation.py 2>/dev/null || true

CMD ["/bin/sh"]
