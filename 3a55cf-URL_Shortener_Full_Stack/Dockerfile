FROM node:20

WORKDIR /workspace

# Copy all files
COPY . .

# Install server dependencies
WORKDIR /workspace/repository_after/server
RUN npm install --silent

# Install client dependencies
WORKDIR /workspace/repository_after/client
RUN npm install --silent

# Back to workspace root
WORKDIR /workspace

# Make all scripts executable
RUN chmod +x run_app.sh run_tests.sh run_evaluation.sh setup.sh run_before.sh run_after.sh 2>/dev/null || true

# Expose ports
EXPOSE 3001 5173

# Default: run tests
CMD ["sh", "run_tests.sh"]
