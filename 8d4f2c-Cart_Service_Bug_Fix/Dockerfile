FROM node:20-slim

WORKDIR /app

# Install curl for downloading MongoDB
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy all project files
COPY repository_before/ ./repository_before/
COPY repository_after/ ./repository_after/
COPY tests/ ./tests/
COPY evaluation/ ./evaluation/

# Install dependencies from repository_after (has same deps as before)
WORKDIR /app/repository_after
RUN npm install
RUN npm install --save-dev jest mongodb-memory-server

# Pre-download MongoDB binary during build
RUN node -e "const { MongoMemoryServer } = require('mongodb-memory-server'); MongoMemoryServer.create().then(s => s.stop());"

# Symlink node_modules to /app so jest can be found
RUN ln -s /app/repository_after/node_modules /app/node_modules

WORKDIR /app

# Default command runs tests - increased timeout for MongoDB startup
CMD ["node", "node_modules/jest/bin/jest.js", "tests/", "--testTimeout=60000", "--forceExit", "--config={}"]

