FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY vitest.config.ts ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Default command: run all tests
CMD ["npm", "run", "test:run"]
