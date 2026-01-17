FROM node:18-alpine

WORKDIR /workspace

# Copy the repository_before contents
COPY repository_before/ ./

# Install dependencies
RUN npm install

# Install MongoDB memory server for testing (no external DB needed)
RUN npm install mongodb-memory-server --save-dev

# Run tests
CMD ["npm", "test"]

