# Multi-stage build for runtime and tests

# Build stage - compile TypeScript and install all dependencies
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build:server

# Tests stage - for running tests and evaluation
FROM build AS tests
WORKDIR /app
# All dependencies and built code are available
# Default command can be overridden by docker-compose run
CMD ["npm", "test"]

# Runtime stage - minimal production image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
