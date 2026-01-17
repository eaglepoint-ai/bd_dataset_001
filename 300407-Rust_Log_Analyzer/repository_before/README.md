# Rust Log Analyzer CLI

Build a command-line tool in Rust that analyzes web server access logs in Combined Log Format.

Combined Log Format Structure:
```
<IP> <identity> <user> [<timestamp>] "<request>" <status> <bytes> "<referer>" "<user-agent>"
```

Example log line:
```
192.168.1.1 - john [10/Oct/2023:13:55:36 -0700] "GET /api/users HTTP/1.1" 200 2326 "https://example.com" "Mozilla/5.0"
```

Field positions (for regex capture groups):
- Field 1: IP address (e.g., 192.168.1.1)
- Field 2: Identity (usually "-")
- Field 3: User (e.g., john or "-")
- Field 4: Timestamp in brackets (e.g., 10/Oct/2023:13:55:36 -0700)
- Field 5: Request in quotes (e.g., "GET /api/users HTTP/1.1")
- Field 6: HTTP status code (e.g., 200)
- Field 7: Response bytes (e.g., 2326, or "-" if unknown)
- Field 8: Referer in quotes
- Field 9: User-Agent in quotes

Usage:
./loganalyzer <logfile.log> [--from "YYYY-MM-DD HH:MM"] [--to "YYYY-MM-DD HH:MM"] [--status 4xx|5xx|2xx] [--top-ips N]

Requirements:

1. Create a complete Rust project with proper Cargo.toml
2. Parse Combined Log Format using regex (use regex crate)
3. Handle date/time parsing and filtering (use chrono crate)
4. Calculate and output these statistics as JSON:
   - total_requests: Total number of log entries
   - total_bytes: Sum of all response bytes
   - requests_by_status: Count grouped by status code (200, 404, 500, etc.)
   - requests_by_hour: Count per hour (format: "2023-10-10 13:00")
   - top_ips: Top N IP addresses by request count (default N=10)
   - error_rate: Percentage of 4xx + 5xx responses
   - avg_response_size: Average bytes per response

5. CLI Arguments:
   - <logfile> - Required: path to log file
   - --from - Optional: start datetime filter (inclusive)
   - --to - Optional: end datetime filter (inclusive)
   - --status - Optional: filter by status class (2xx, 3xx, 4xx, 5xx)
   - --top-ips - Optional: number of top IPs to show (default: 10)

6. Error Handling:
   - File not found → stderr message, exit code 1
   - Invalid log line → skip and count as skipped_lines in output
   - Invalid date filter → stderr message, exit code 1

7. Output pretty-printed JSON to stdout

8. If you are not familiar with Rust, refer to these resources:
   - Rust Official Book: https://doc.rust-lang.org/book/
   - Rust by Example: https://doc.rust-lang.org/rust-by-example/
   - regex crate docs: https://docs.rs/regex/latest/regex/
   - chrono crate docs: https://docs.rs/chrono/latest/chrono/
   - clap crate docs: https://docs.rs/clap/latest/clap/
   - serde_json docs: https://docs.rs/serde_json/latest/serde_json/
   - You may also use an AI assistant to help implement the solution.

Example Output:
```json
{
  "total_requests": 15423,
  "total_bytes": 524288000,
  "skipped_lines": 3,
  "requests_by_status": {
    "200": 14000,
    "301": 500,
    "404": 800,
    "500": 123
  },
  "requests_by_hour": {
    "2023-10-10 13:00": 234,
    "2023-10-10 14:00": 456
  },
  "top_ips": [
    {"ip": "192.168.1.1", "count": 523},
    {"ip": "10.0.0.5", "count": 412}
  ],
  "error_rate": 5.99,
  "avg_response_size": 34012.5
}
```

