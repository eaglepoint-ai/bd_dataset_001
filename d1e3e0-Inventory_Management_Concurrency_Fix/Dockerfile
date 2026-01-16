FROM node:20-slim

WORKDIR /app

# Install build dependencies for sqlite3/native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . /app

# Default command
CMD ["npx", "ts-node", "-e", "console.log('TypeScript OK')"]

