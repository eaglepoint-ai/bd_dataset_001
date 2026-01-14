# Email Parser RFC 5322 Fix

## Problem Statement

A legacy email parsing library used in production is failing on edge cases. Users report corrupted email bodies, missing attachments, and incorrect sender addresses. The EmailParser class needs to be refactored to handle RFC 5322 compliant emails correctly while maintaining the same public API.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** Your company's email processing pipeline uses a custom EmailParser class. Users report issues with parsing emails from various clients (Gmail, Outlook, Apple Mail). The parser works for simple emails but fails on real-world edge cases. You need to fix all bugs while maintaining the exact same public API (parse, get_headers, get_body, get_attachments).

**Scale Assumptions:**
- Processing 50,000 emails/day
- Emails range from 1KB to 25MB
- Mix of plain text, HTML, and multipart

---

## Core Requirements (Must Fix)

### 1. Multipart Boundary Parsing
- Handle nested multipart/mixed inside multipart/alternative
- Boundary string may contain special characters

### 2. Header Decoding
- RFC 2047 encoded-word (=?UTF-8?B?...?=)
- Header folding (continuation lines start with whitespace)
- Multiple values for same header (Received, etc.)

### 3. Body Encoding
- Base64 decode with line breaks
- Quoted-printable soft line breaks (=\r\n)
- Charset conversion (ISO-8859-1, UTF-8, Windows-1252)

### 4. Attachment Extraction
- Content-Disposition: attachment; filename="..."
- Inline attachments with Content-ID
- Filename encoding (RFC 2231)

### 5. Date Parsing
- Multiple timezone formats (+0530, PST, GMT)
- Two-digit vs four-digit years
- Missing timezone defaults to UTC

---

## Bonus Requirements

6. Email threading (References, In-Reply-To headers)
7. HTML sanitization for body
8. Memory efficiency for large attachments (streaming)

---

## Constraints

- Do NOT use external email libraries (email, mailparser)
- Do NOT use regex for boundary parsing (state machine required)
- Must handle malformed emails gracefully (no crashes)
- Pure Python, no C extensions

---

## Edge Cases to Handle

- Boundary string appears in body content
- Missing Content-Type defaults to text/plain; charset=us-ascii
- Nested encodings (base64 of quoted-printable)
- Empty parts in multipart
- No blank line between headers and body
- CRLF vs LF line endings mixed

---

## Error Handling

- Return ParseError with specific code: INVALID_HEADER, DECODE_ERROR, BOUNDARY_ERROR, CHARSET_ERROR
- Partial parsing: return what's parseable, errors for failed parts
- Never raise exceptions, always return result object

---

## Acceptance Criteria

1. Simple plain text email parses correctly
2. HTML email with inline images extracts all parts
3. Email with 3 attachments returns all 3 with correct filenames
4. RFC 2047 encoded subject "=?UTF-8?B?SGVsbG8=?=" decodes to "Hello"
5. Quoted-printable body with soft breaks renders correctly
6. Nested multipart (alternative inside mixed) extracts all parts
7. Malformed email returns partial result + errors list

---

## Verification

1. Parse test_simple.eml → body matches expected
2. Parse test_multipart.eml → 2 parts (text + HTML)
3. Parse test_attachments.eml → 3 attachments extracted
4. Parse test_encoded.eml → headers decoded correctly
5. Parse test_malformed.eml → no crash, errors returned

---

## Public API (Must Maintain)

```python
class EmailParser:
    def parse(self, raw_email: bytes) -> ParseResult
    def get_headers(self) -> dict
    def get_body(self) -> str  
    def get_attachments(self) -> list[Attachment]
```

---

## Commands

### Run repository_before
```bash
docker-compose run --rm app python -c "from repository_before import EmailParser; print('OK')"
```

### Run tests
```bash
docker-compose run --rm app pytest -v tests/
```

### Run evaluation
```bash
docker-compose run --rm app python evaluation/evaluation.py
```


