# Trajectory (Thinking Process for Refactoring)

## 1. Audit the Original Code

I audited the original Flask webhook implementation and identified multiple production risks: repeated environment variable lookups per request, fragile HMAC signature verification relying on implicit dictionary ordering, inefficient string and datetime operations, timezone-unsafe timestamp handling, weak replay-attack protection, insufficient input validation, and error handling that exposed internal exception details. These issues increased per-request CPU usage and introduced security and reliability concerns.

## 2. Define a Security and Performance Contract

Before refactoring, I defined a strict contract: preserve the exact API route, response formats, and HTTP status codes while improving internal security, performance, and robustness. Signature verification must be deterministic and timing-attack resistant, replay protection must be reliable and UTC-safe, secrets must be loaded once at startup, per-request overhead must be minimized, error responses must not leak internal details, and the solution must remain thread-safe without introducing new frameworks or infrastructure.

## 3. Eliminate Per-Request Configuration and Inefficiencies

I moved secret loading and validation to application startup to eliminate repeated environment lookups and ensure fast failure on misconfiguration. Shared state is immutable, ensuring thread safety and reduced runtime overhead.

## 4. Rebuild Signature Verification for Determinism and Safety

I replaced dictionary-based string concatenation with raw request body signing to ensure deterministic, byte-for-byte HMAC verification. Signature comparison uses constant-time hmac.compare_digest, eliminating ordering ambiguity and timing attack risks.

## 5. Implement Efficient and Reliable Replay Protection

I replaced timezone-sensitive datetime logic with integer-based UTC timestamp comparisons. Replay detection now relies on simple, fast arithmetic while preserving the original replay window semantics.

## 6. Enforce Strict Input Validation and Harden Error Handling

I added defensive validation for JSON parsing, payload structure, and required fields before performing expensive operations. Database and unexpected errors are caught and mapped to generic responses, preventing leakage of sensitive internal details while preserving response codes.

## 7. Validate with Deterministic, Environment-Driven Tests

I implemented a single test suite that dynamically targets the original or refactored implementation via environment variables. The tests validate signature verification, replay protection, strict input validation, correct HTTP responses, and safe error handling, with database interactions mocked for determinism and speed.

## 8. Result

The final implementation preserves the exact API contract while delivering a secure, deterministic, and efficient webhook endpoint. Per-request CPU and memory usage are minimized, replay attacks are reliably prevented, error handling is hardened, and the system is suitable for high-traffic production use.

---