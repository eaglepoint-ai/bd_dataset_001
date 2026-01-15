FROM node:20

WORKDIR /app

# Install system dependencies for SELinux compatibility (Debian/Ubuntu)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends bash git python3 build-essential \
	&& npm install -g mocha ts-node \
	&& rm -rf /var/lib/apt/lists/*

# Copy all sources for both before/after
COPY repository_before/ /app/repository_before/
COPY repository_after/ /app/repository_after/
COPY prisma/ /app/prisma/
COPY tsconfig.json /app/tsconfig.json
# Note: tests/ and evaluation/ will be mounted as volumes

# Install dependencies for both before/after
WORKDIR /app/repository_before
RUN npm install --legacy-peer-deps

WORKDIR /app/repository_after
RUN npm install --legacy-peer-deps

# Generate Prisma client for both repositories (if schema exists)
# This will fail gracefully if schema doesn't exist, but allows setup if it does
WORKDIR /app/repository_before
RUN npx prisma generate --schema=/app/prisma/schema.prisma || echo "Prisma schema not found in repository_before, skipping..."

WORKDIR /app/repository_after
RUN npx prisma generate --schema=/app/prisma/schema.prisma || echo "Prisma schema not found in repository_after, skipping..."

# Back to root for commands
WORKDIR /app

# Entrypoint is overridden by docker-compose

