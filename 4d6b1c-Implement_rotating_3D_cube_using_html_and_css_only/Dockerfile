FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

# Copy package.json to install dependencies
# Install pnpm
RUN npm install -g pnpm

# Copy package.json to install dependencies
COPY tests/package.json ./tests/

# Install dependencies
WORKDIR /app/tests/
COPY tests/pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the application code
WORKDIR /app
COPY . .

# Set the working directory to tests for running the command
WORKDIR /app/tests/

# Default command to run tests
CMD ["pnpm", "test"]
