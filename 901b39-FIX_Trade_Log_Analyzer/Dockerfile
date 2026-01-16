FROM rust:1.75-alpine

WORKDIR /workspace

RUN apk add --no-cache musl-dev

COPY repository_after/ .

RUN cargo test --release

CMD ["cargo", "test", "--release"]
