FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY repository_before/package.json ./
RUN npm install --legacy-peer-deps 2>/dev/null || true

# Copy source files
COPY repository_before/ ./

# TypeScript compilation check
CMD ["npx", "tsc", "--noEmit"]

