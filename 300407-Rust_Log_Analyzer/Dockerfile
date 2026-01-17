FROM rust:1.75-slim

WORKDIR /app

# Copy the project files
COPY repository_after ./repository_after
COPY tests ./tests

# Set working directory to repository_after where Cargo.toml is
WORKDIR /app/repository_after

# Build the project
RUN cargo build --release

# Run tests
CMD ["cargo", "test", "--release"]

