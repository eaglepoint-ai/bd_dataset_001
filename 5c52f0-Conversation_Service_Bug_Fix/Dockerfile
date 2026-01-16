FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy root package.json
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy all repositories and tests
# We use COPY here to populate the image, but volumes will override in dev
COPY repository_before ./repository_before
COPY repository_after ./repository_after
COPY tests ./tests
COPY evaluation ./evaluation

# Generate Prisma Client (Assuming repository_before has the schema)
# We need to run this against the schema.
# Schema is likely in repository_before/prisma/schema.prisma
RUN npx prisma generate --schema=./repository_after/prisma/schema.prisma

# Default command (overridden by docker compose run)
CMD ["npx", "jest"]
