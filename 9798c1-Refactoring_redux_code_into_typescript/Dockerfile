FROM node:20-slim

WORKDIR /app

# Copy package files (for layer caching)
COPY repository_after/package*.json ./repository_after/
COPY repository_before/package*.json ./repository_before/
COPY tests/package*.json ./tests/
COPY evaluation/package*.json ./evaluation/

# Install Node dependencies
RUN cd repository_after && npm ci --legacy-peer-deps || npm install --legacy-peer-deps
RUN cd repository_before && npm ci --legacy-peer-deps || npm install --legacy-peer-deps
RUN cd tests && npm install
RUN cd evaluation && npm install

# Copy all files
COPY . .

# Make evaluation script executable (best-effort)
RUN chmod +x evaluation/evaluation.js 2>/dev/null || true

# Default command runs evaluation
CMD ["node", "evaluation/evaluation.js"]
