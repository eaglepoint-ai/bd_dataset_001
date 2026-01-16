FROM rust:1.75-slim

WORKDIR /app

# Copy the project files
COPY . .

# Build the project
RUN cargo build --release

# Run tests
CMD ["cargo", "test", "--release"]

