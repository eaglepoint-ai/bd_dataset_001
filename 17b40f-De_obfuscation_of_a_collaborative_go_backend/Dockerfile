FROM golang:1.23-alpine

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git

# Copy repository_before folder
COPY repository_before/ ./repository_before/

# Copy tests folder INTO repository_before so they share the same go.mod/sum
COPY tests/ ./repository_before/tests/

# Set working directory to repository_before
WORKDIR /app/repository_before

# Download dependencies
RUN go mod download

# Default command - run the server
CMD ["go", "run", "server.go"]
