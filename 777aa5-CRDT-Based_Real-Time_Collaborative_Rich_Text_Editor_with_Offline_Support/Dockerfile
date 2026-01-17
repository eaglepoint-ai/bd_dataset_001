FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY repository_after/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY repository_after/ ./

# Copy tests directory from project root to /tests
COPY tests/ /tests/

# Copy evaluation directory
COPY evaluation/ ./evaluation/

# Build TypeScript
RUN npm run build || true

# Default command (can be overridden)
CMD ["npm", "test"]
