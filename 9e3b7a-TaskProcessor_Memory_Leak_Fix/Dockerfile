FROM node:20-slim

# Install git for evaluation script
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN npm install

# Set environment
ENV NODE_ENV=test

# Default command
CMD ["npm", "test"]
