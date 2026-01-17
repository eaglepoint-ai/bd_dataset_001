FROM node:18-slim

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY repository_after/package*.json ./repository_after/
COPY repository_before/package*.json ./repository_before/
COPY tests/package*.json ./tests/
COPY evaluation/package*.json ./evaluation/

# Install dependencies (these tasks are intentionally dependency-light)
RUN cd repository_after && npm install
RUN cd repository_before && npm install
RUN cd tests && npm install
RUN cd evaluation && npm install

# Copy rest of the repo
COPY . .

# Make evaluation script executable
RUN chmod +x evaluation/evaluation.js

# Default command runs evaluation
CMD ["node", "evaluation/evaluation.js"]
