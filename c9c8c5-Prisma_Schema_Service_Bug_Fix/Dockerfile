FROM node:18-slim

WORKDIR /app

# Copy package files for all directories
COPY repository_before/package*.json ./repository_before/
COPY repository_after/package*.json ./repository_after/
COPY tests/package*.json ./tests/
COPY evaluation/package*.json ./evaluation/

# Install dependencies
RUN cd repository_before && npm install
RUN cd repository_after && npm install
RUN cd tests && npm install
RUN cd evaluation && npm install && npm install -g ts-node

# Copy all source files
COPY . .

# Make evaluation script executable
RUN chmod +x evaluation/evaluation.ts

CMD ["ts-node", "evaluation/evaluation.ts"]
