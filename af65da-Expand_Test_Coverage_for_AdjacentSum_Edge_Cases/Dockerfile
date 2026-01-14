# Stage 1: Build & Setup
FROM eclipse-temurin:11-jdk-focal AS builder
WORKDIR /app

# Install curl only once and clean up immediately
RUN apt-get update && apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Download dependencies in the builder stage
RUN mkdir -p lib && \
    curl -L -o lib/junit-4.13.2.jar https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar && \
    curl -L -o lib/hamcrest-core-1.3.jar https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar

# Stage 2: Final Runtime
FROM eclipse-temurin:11-jdk-focal
WORKDIR /app

# Install python3 (final runtime needs it)
RUN apt-get update && apt-get install -y python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy only what is needed from builder
COPY --from=builder /app/lib ./lib
COPY . .

# Recommended: Run as a non-root user for security
USER 1000

ENTRYPOINT [ "python3", "tests/meta_test.py" ]
