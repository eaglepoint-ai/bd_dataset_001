FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Create evaluation output directory
RUN mkdir -p /app/evaluation

# Default command runs evaluation
CMD ["npm", "run", "evaluate"]
