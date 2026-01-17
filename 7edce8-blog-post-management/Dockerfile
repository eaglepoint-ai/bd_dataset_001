FROM node:20-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy TypeScript config if it exists
COPY tsconfig*.json ./

# Copy source code
COPY . .

# Build TypeScript if build script exists
RUN npm run build || echo "No build script found, skipping build"

# Expose port if needed (adjust based on your app)
EXPOSE 3000

# Run the application (adjust command based on your package.json scripts)
# Default to 'start' but can be overridden in docker-compose
# CMD ["npm", "start"]
