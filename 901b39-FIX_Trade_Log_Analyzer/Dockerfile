FROM rust:1.75-alpine

WORKDIR /workspace

RUN apk add --no-cache musl-dev

COPY repository_before/ .

RUN cargo check

CMD ["echo", "FIX Trade Analyzer syntax check passed"]
