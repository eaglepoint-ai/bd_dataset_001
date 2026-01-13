# Use Node.js LTS version
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the core project structure 
COPY repository_before/ ./repository_before/
COPY repository_after/ ./repository_after/
COPY tests/ ./tests/
COPY evaluation/ ./evaluation/
#COPY test.js .

# Create the reports directory as required by the guide [cite: 17]
RUN mkdir -p evaluation/reports

# Ensure evaluation script is executable [cite: 27]
RUN chmod +x evaluation/evaluation.js

# Default command runs the evaluation as the main entry point [cite: 29]
CMD ["node", "evaluation/evaluation.js"]