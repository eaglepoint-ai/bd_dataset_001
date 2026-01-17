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
COPY tsconfig.json /app/tsconfig.json
# Note: tests/ and evaluation/ will be mounted as volumes

# Install dependencies for both before/after
WORKDIR /app/repository_before
RUN npm install --legacy-peer-deps

WORKDIR /app/repository_after
RUN npm install --legacy-peer-deps

# Back to root for commands
WORKDIR /app

# Entrypoint is overridden by docker-compose

