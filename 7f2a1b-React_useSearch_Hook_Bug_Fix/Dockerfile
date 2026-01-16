# Use Node.js LTS version
FROM node:20-alpine

# Install git for git info in evaluation
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy entire project structure
COPY . .

# Create evaluation output directory
RUN mkdir -p evaluation

# Set environment variables
ENV NODE_ENV=test

# Default command
CMD ["npm", "test"]
