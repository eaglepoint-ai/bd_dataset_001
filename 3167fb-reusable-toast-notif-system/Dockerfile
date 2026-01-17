FROM node:20-slim

# Install python and clean up for evaluation support
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first
COPY repository_after/package*.json ./repository_after/

# Install dependencies
RUN cd repository_after && npm install

# Copy all project assets
COPY repository_after ./repository_after
COPY repository_before ./repository_before
COPY tests ./tests
COPY evaluation ./evaluation

WORKDIR /app/repository_after

# Expose the Vite dev port
EXPOSE 5173

# By default, run tests and exit with their status code
CMD ["npm", "run", "test", "--", "--run"]
