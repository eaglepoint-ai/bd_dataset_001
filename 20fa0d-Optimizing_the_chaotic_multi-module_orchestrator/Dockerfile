# Optimized Dockerfile for ChaoticComponent Evaluation
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM mcr.microsoft.com/playwright:v1.40.0-focal AS playwright-base

FROM base AS deps

COPY package*.json ./
COPY repository_before/package*.json ./repository_before/
COPY repository_after/package*.json ./repository_after/
COPY tests/package*.json ./tests/

# Install full dependencies (including devDependencies) so we can run dev servers and tests
RUN npm install --quiet && \
    cd repository_before && npm install --quiet && \
    cd ../repository_after && npm install --quiet && \
    cd ../tests && npm install --quiet

FROM playwright-base AS final

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/repository_before/node_modules ./repository_before/node_modules
COPY --from=deps /app/repository_after/node_modules ./repository_after/node_modules
COPY --from=deps /app/tests/node_modules ./tests/node_modules

COPY package*.json ./
COPY repository_before ./repository_before
COPY repository_after ./repository_after
COPY tests ./tests
COPY evaluation ./evaluation

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "evaluate"]
