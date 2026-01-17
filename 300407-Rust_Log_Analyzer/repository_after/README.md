# Rust Log Analyzer

## Building

```bash
cargo build --release
```

## Running

Analyze a log file:
```bash
./target/release/loganalyzer tests/sample.log
```

With filters:
```bash
./target/release/loganalyzer tests/sample.log --from "2023-10-10 14:00"
./target/release/loganalyzer tests/sample.log --status 4xx
./target/release/loganalyzer tests/sample.log --top-ips 5
```

## Testing

```bash
cargo test --release
```

## Docker

Run tests:
```bash
docker compose run --rm app-after
```

Run evaluation:
```bash
docker compose run --rm evaluation
```
