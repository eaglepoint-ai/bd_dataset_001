FROM node:18-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies from repository_after
WORKDIR /app/repository_after
RUN npm install

# Go back to root
WORKDIR /app

# Default command
CMD ["npm", "test"]

