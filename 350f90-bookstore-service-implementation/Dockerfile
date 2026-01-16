# Base image with Rust (latest to support new lockfiles)
FROM rust:latest

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Optimize Rust Build Caching
WORKDIR /app

# 1. Create dummy project structure
RUN mkdir -p repository_after/bookstore_backend/src
RUN echo "fn main() {}" > repository_after/bookstore_backend/src/main.rs
COPY repository_after/bookstore_backend/Cargo.toml repository_after/bookstore_backend/

# 2. Build dependencies (cached layer)
WORKDIR /app/repository_after/bookstore_backend
RUN cargo build --release
RUN rm src/*.rs ./target/release/deps/bookstore_backend*

# 3. Setup Python environment (cached layer)
WORKDIR /app
COPY requirements.txt .
# Use --break-system-packages if needed for newer Debian/Python versions, 
# or create venv. simpler to just install globally in container.
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || \
    pip3 install --no-cache-dir -r requirements.txt

# 4. Copy actual source code
COPY . /app

# 5. Build the actual application (so it's ready)
WORKDIR /app/repository_after/bookstore_backend
RUN cargo build --release

# Reset workdir
WORKDIR /app

# Default command
CMD ["python3", "evaluation/evaluation.py"]
