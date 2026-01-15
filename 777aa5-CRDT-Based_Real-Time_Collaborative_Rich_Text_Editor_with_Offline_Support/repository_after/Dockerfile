# Multi-stage build for runtime and tests

# Build stage - compile TypeScript and install all dependencies
FROM node:20 AS build

WORKDIR /app

# Copy package files
RUN npm install --legacy-peer-deps
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build:server

FROM node:20 AS app
FROM node:20-alpine AS app
WORKDIR /app

# Copy package files
RUN npm install --legacy-peer-deps  # Install ALL dependencies (including devDependencies)
RUN npm install  # Install ALL dependencies (not just production)

# Copy built files and source from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/tests ./tests
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json

# Expose port
EXPOSE 3000

# Default command (can be overridden by docker-compose)
CMD ["npm", "start"]
