FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY tests/package.json tests/
COPY evaluation/package.json evaluation/

# Install dependencies
RUN cd tests && npm install
RUN cd evaluation && npm install

# Copy project files
COPY . .

# Default command
CMD ["npm", "test"]