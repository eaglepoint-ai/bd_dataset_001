FROM rust:1.75
WORKDIR /app
COPY repository_before/ .
RUN cargo build --release
CMD ["cargo", "run", "--release"]

