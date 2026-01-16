FROM node:18-alpine

WORKDIR /workspace

# Copy entire project structure
COPY . .

# Install dependencies in repository_after
RUN cd repository_after && npm install

# Make shell scripts executable
RUN chmod +x run_tests.sh build.sh runner.sh

# Expose port
EXPOSE 3000

# Default command runs the app
CMD ["sh", "-c", "cd repository_after && npm start"]
