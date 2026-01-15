FROM node:20-slim

WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN npm install

# Set environment
ENV NODE_ENV=test

# Default command
CMD ["npm", "test"]
