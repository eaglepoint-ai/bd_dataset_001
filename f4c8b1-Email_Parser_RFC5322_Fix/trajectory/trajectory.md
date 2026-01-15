# Email Parser RFC 5322 Fix - Implementation Trajectory

## 1. Audit the Original Code (Identify RFC 5322 Violations)

I audited the original `repository_before/email_parser.py` implementation and identified critical bugs that prevented real-world email parsing:

**Major Issues Found:**

- **Regex-based boundary parsing**: Used `split('--' + boundary)` which fails when the boundary string appears in email body content
- **Missing header folding support**: Multiline headers (continuation lines starting with whitespace) were not handled
- **Broken Base64 decoding**: Failed on line-wrapped Base64 content (common in email bodies)
- **No RFC 2047 support**: Encoded headers like `=?UTF-8?B?SGVsbG8=?=` remained undecoded
- **No charset conversion**: Missing fallback chain for different character encodings
- **Single-value headers only**: Could not handle multiple values for same header (e.g., multiple `Received` headers)
- **No RFC 2231 filename encoding**: Attachment filenames with special characters failed to extract

These violations meant the parser worked only for trivial emails but failed on real-world messages from Gmail, Outlook, and Apple Mail.

**Learn more:**
- RFC 5322 specification: https://datatracker.ietf.org/doc/html/rfc5322
- Understanding MIME and multipart emails: https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html

---

## 2. Define Compliance Requirements First

I established RFC 5322 compliance as the performance contract before writing any code:

**Mandatory Requirements:**
1. **State machine boundary parsing** (no regex) - prevents false positives when boundary appears in body
2. **RFC 2047 header decoding** - handles encoded-word format with Base64 'B' and Quoted-Printable 'Q'
3. **Header folding support** - correctly parses continuation lines
4. **Charset conversion** - fallback chain: UTF-8 → ISO-8859-1 → Windows-1252 → Latin-1
5. **Nested multipart handling** - supports multipart/alternative inside multipart/mixed
6. **RFC 2231 filename encoding** - extracts attachment names with special characters
7. **Error codes** - structured errors: INVALID_HEADER, DECODE_ERROR, BOUNDARY_ERROR, CHARSET_ERROR
8. **Partial parsing** - return what's parseable, errors for failed parts

**Performance Contract:**
- No crashes on malformed emails
- Parse 50,000 emails/day (1KB-25MB range)
- Handle CRLF vs LF line ending variations
- Maintain exact same public API: `parse()`, `get_headers()`, `get_body()`, `get_attachments()`

**Learn more:**
- Email standards overview: https://en.wikipedia.org/wiki/Email#Standards

---

## 3. Rework the Parser Architecture for Compliance

I redesigned the parser from a procedural regex-based approach to a structured, testable architecture:

**Architectural Changes:**

**Before (Procedural):**
```python
def parse(raw_email):
    parts = raw_email.split('--boundary')  # ❌ Fragile
    # Everything in one function
    # No state tracking
```

**After (Structured):**
```python
class EmailParser:
    def __init__(self):
        self._headers = {}
        self._body = ""
        self._attachments = []
        self._errors = []
    
    # Separation of concerns:
    def _split_headers_body()
    def _parse_headers()
    def _decode_header_value()
    def _extract_boundary()
    def _parse_multipart_state_machine()
    def _extract_parts()
    def _decode_body()
    def _extract_filename()
```

**Key Design Decisions:**

1. **Instance variables** store parsed state so `get_headers()`, `get_body()`, `get_attachments()` return cached results
2. **Separation of concerns** - each method has one responsibility
3. **State machine** for boundary parsing instead of string splitting
4. **Error accumulation** - collect errors without crashing

**Learn more:**
- Separation of concerns principle: https://en.wikipedia.org/wiki/Separation_of_concerns

---

## 4. Implement State Machine for Boundary Parsing

I replaced regex-based boundary detection with a deterministic state machine to prevent false positives:

**State Machine Design:**

```
SEARCHING → (found boundary line) → IN_PART → (found end boundary) → END
     ↑                                   ↓
     └───────────────────────────────────┘
            (accumulate part content)
```

**Why State Machine vs Regex?**

**Regex approach (broken):**
```python
parts = content.split('--' + boundary)  # ❌ Fails if boundary appears in body
```

**State machine approach (correct):**
```python
state = 'SEARCHING'
for line in lines:
    if line.startswith('--' + boundary + '--'):
        state = 'END'
    elif line.startswith('--' + boundary):
        if state == 'IN_PART':
            parts.append(current_part)
        state = 'IN_PART'
    elif state == 'IN_PART':
        current_part.append(line)
```

**Benefits:**
- Correctly identifies boundary only at line start (per RFC 2046)
- Handles boundary string appearing in body content
- Supports nested multipart (state machine recursion)
- Prevents exploding result sets from false matches

**Learn more:**
- Why regex fails for parsing structured formats: https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
- State machine design patterns: https://refactoring.guru/design-patterns/state

---

## 5. Fix Header Parsing (RFC 2047 + Folding)

I implemented complete RFC 2047 encoded-word decoding and header folding support:

**Header Folding (Continuation Lines):**

**Before (broken):**
```python
headers = {}
for line in header_lines:
    key, value = line.split(':', 1)  # ❌ Crashes on folded headers
    headers[key] = value
```

**After (correct):**
```python
current_line = ""
for line in lines:
    if line[0] in (' ', '\t'):  # Continuation line
        current_line += ' ' + line.strip()
    else:
        if current_line:
            parse_header(current_line)
        current_line = line
```

**RFC 2047 Encoded-Word Decoding:**

Handles formats like: `=?UTF-8?B?SGVsbG8gV29ybGQ=?=`

**Implementation:**
```python
def _decode_header_value(self, value):
    pattern = r'=\?([^?]+)\?([BQ])\?([^?]+)\?='
    
    for match in re.finditer(pattern, value):
        charset, encoding, encoded_text = match.groups()
        
        if encoding == 'B':  # Base64
            decoded_bytes = base64.b64decode(encoded_text)
        elif encoding == 'Q':  # Quoted-Printable
            decoded_bytes = quopri.decodestring(encoded_text.replace('_', ' '))
        
        decoded_text = decoded_bytes.decode(charset, errors='replace')
        value = value.replace(match.group(0), decoded_text)
```

**Multiple Same-Name Headers:**

Changed from `dict[str, str]` to `dict[str, List[str]]` to support multiple `Received` headers.

**Learn more:**
- RFC 2047 MIME Encoded-Word specification: https://datatracker.ietf.org/doc/html/rfc2047
- Header folding explained: https://www.rfc-editor.org/rfc/rfc5322#section-2.2.3

---

## 6. Correct Body Decoding (Base64 + Quoted-Printable)

I fixed content decoding to handle line-wrapped Base64 and soft line breaks in Quoted-Printable:

**Base64 with Line Breaks:**

**Before (broken):**
```python
decoded = base64.b64decode(body)  # ❌ Fails on line-wrapped content
```

**After (correct):**
```python
# Remove all line breaks before decoding
clean_body = body.replace('\r\n', '').replace('\n', '').replace('\r', '')
decoded = base64.b64decode(clean_body)
```

**Quoted-Printable with Soft Breaks:**

Used Python's `quopri` module which correctly handles soft line breaks (`=\r\n`):

```python
import quopri
decoded_bytes = quopri.decodestring(body.encode('utf-8'))
```

**Charset Conversion with Fallback Chain:**

```python
def _decode_body(self, body, encoding, charset):
    # Decode transfer encoding
    if encoding == 'base64':
        decoded_bytes = base64.b64decode(body.replace('\r\n', ''))
    elif encoding == 'quoted-printable':
        decoded_bytes = quopri.decodestring(body.encode('utf-8'))
    else:
        decoded_bytes = body.encode('utf-8')
    
    # Try charset conversion with fallbacks
    for fallback_charset in [charset, 'utf-8', 'iso-8859-1', 'windows-1252', 'latin-1']:
        try:
            return decoded_bytes.decode(fallback_charset)
        except (UnicodeDecodeError, LookupError):
            continue
    
    return decoded_bytes.decode('utf-8', errors='replace')  # Last resort
```

**Learn more:**
- Base64 encoding explained: https://developer.mozilla.org/en-US/docs/Glossary/Base64
- Quoted-Printable encoding: https://datatracker.ietf.org/doc/html/rfc2045#section-6.7
- Character encoding guide: https://www.w3.org/International/questions/qa-what-is-encoding

---

## 7. Add Attachment Extraction with RFC 2231 Support

I implemented proper attachment extraction with RFC 2231 filename encoding and Content-ID support:

**RFC 2231 Filename Encoding:**

Handles encoded filenames like: `filename*=UTF-8''%E2%9C%93%20report.pdf`

```python
def _extract_filename(self, content_disposition):
    # RFC 2231: filename*=charset'language'encoded-value
    rfc2231_match = re.search(r"filename\*=([^']*)'([^']*)'(.+)", content_disposition)
    if rfc2231_match:
        charset, language, encoded_value = rfc2231_match.groups()
        decoded_value = urllib.parse.unquote(encoded_value)
        return decoded_value
    
    # Standard: filename="value"
    standard_match = re.search(r'filename="?([^";\r\n]+)"?', content_disposition)
    if standard_match:
        return standard_match.group(1).strip()
```

**Content-Disposition vs Inline Attachments:**

```python
# Regular attachments
if 'content-disposition' in part_headers:
    if 'attachment' in part_headers['content-disposition']:
        filename = self._extract_filename(part_headers['content-disposition'])

# Inline attachments (images)
if 'content-id' in part_headers and content_type.startswith('image/'):
    filename = part_headers['content-id'].strip('<>')
```

**Nested Part Handling:**

Recursively process nested multipart structures to extract all attachments:

```python
if content_type.startswith('multipart/'):
    nested_boundary = self._extract_boundary(content_type)
    nested_parts = self._parse_multipart_state_machine(part_body, nested_boundary)
    self._extract_parts(nested_parts)  # Recursive
```

**Learn more:**
- RFC 2231 MIME Parameter Value and Encoded Word Extensions: https://datatracker.ietf.org/doc/html/rfc2231
- Content-Disposition header explained: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition

---

## 8. Eliminate Crashes with Robust Error Handling

I replaced crashes with structured error reporting using error codes:

**Error Code System:**

```python
class ParseError(Exception):
    INVALID_HEADER = "INVALID_HEADER"
    DECODE_ERROR = "DECODE_ERROR"
    BOUNDARY_ERROR = "BOUNDARY_ERROR"
    CHARSET_ERROR = "CHARSET_ERROR"
    
    def __init__(self, code, message, line_number=None):
        self.code = code
        self.message = message
        self.line_number = line_number
```

**Partial Parsing:**

Instead of crashing on first error, collect errors and return partial results:

```python
def parse(self, raw_email: bytes) -> ParseResult:
    try:
        # Parse headers
        self._parse_headers(header_section)
    except Exception as e:
        self._errors.append(ParseError(
            ParseError.INVALID_HEADER,
            f"Header parsing failed: {str(e)}"
        ))
    
    try:
        # Parse body
        self._extract_parts(parts)
    except Exception as e:
        self._errors.append(ParseError(
            ParseError.DECODE_ERROR,
            f"Body decoding failed: {str(e)}"
        ))
    
    return ParseResult(
        headers=self._headers,
        body=self._body,
        attachments=self._attachments,
        errors=self._errors  # ✓ Return partial results + errors
    )
```

**Edge Case Handling:**

- Missing blank line between headers and body → insert artificial separator
- CRLF vs LF mixing → normalize to LF
- Empty parts in multipart → skip without crashing
- Missing Content-Type → default to `text/plain; charset=us-ascii`

**Learn more:**
- Error handling best practices in Python: https://realpython.com/python-exceptions/

---

## 9. Build Comprehensive Test Suite (25 Test Cases)

I created a comprehensive pytest test suite covering all requirements and edge cases:

**Test Organization:**

```python
class TestSimpleEmails:
    # Basic functionality
    test_parse_simple_plaintext_email()
    test_parse_multipart_email()
    test_parse_email_with_attachments()

class TestEdgeCases:
    # RFC compliance
    test_rfc2047_subject_decoding()
    test_header_folding()
    test_multiple_same_name_headers()
    test_quoted_printable_body()
    test_base64_body_with_line_breaks()
    test_nested_multipart()
    test_rfc2231_filename_encoding()
    test_boundary_in_body()

class TestErrorHandling:
    # Robustness
    test_malformed_email_no_blank_line()
    test_malformed_email_invalid_boundary()
    test_charset_conversion_fallback()

class TestPublicAPI:
    # API contract
    test_get_headers_returns_dict()
    test_get_body_returns_string()
    test_get_attachments_returns_list()

class TestBeforeVsAfter:
    # Before/after comparison
    test_before_has_bugs()
    test_before_header_folding_fails()
```

**Test Fixtures:**

Created 7 sample email files in `tests/fixtures/`:
- `simple.eml` - plain text email
- `multipart.eml` - HTML + text
- `attachments.eml` - 3 file attachments
- `encoded.eml` - RFC 2047 headers
- `malformed.eml` - missing blank line
- `nested_multipart.eml` - alternative inside mixed
- `header_folding.eml` - multiline headers

**Test Results:**
- ✅ 25/25 tests pass with `repository_after`
- ❌ 8/25 tests fail with `repository_before` (confirms bugs)

**Learn more:**
- Pytest best practices: https://docs.pytest.org/en/stable/goodpractices.html
- Test fixture patterns: https://docs.pytest.org/en/stable/fixture.html

---

## 10. Result: RFC 5322 Compliance + Measurable Improvements

The refactored implementation achieves full RFC 5322 compliance with measurable improvements:

**Verification Results:**

✅ **All 25 tests pass** - comprehensive coverage of requirements
✅ **State machine prevents false boundary matches** - no more body content corruption
✅ **RFC 2047 headers decode correctly** - `=?UTF-8?B?SGVsbG8=?=` → "Hello"
✅ **Attachments extract with proper filenames** - RFC 2231 support works
✅ **Charset conversion never crashes** - fallback chain handles all encodings
✅ **Header folding handled** - multiline headers parse correctly
✅ **Nested multipart works** - alternative inside mixed extracts all parts
✅ **Partial parsing on errors** - malformed emails return partial results + error codes

**Performance Improvements:**

| Metric | Before | After |
|--------|--------|-------|
| Simple email parsing | ✅ Works | ✅ Works |
| Multipart with attachments | ❌ Fails (wrong count) | ✅ Works (all 3 extracted) |
| RFC 2047 encoded headers | ❌ Remains encoded | ✅ Decodes correctly |
| Header folding | ❌ Crashes | ✅ Handles correctly |
| Boundary in body | ❌ False matches | ✅ No false positives |
| Malformed emails | ❌ Crashes | ✅ Partial parse + errors |
| Charset conversion | ❌ Crashes on unknown | ✅ Fallback chain |

**Docker Verification:**

```bash
# Before tests (confirms bugs exist)
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -q
# Result: 17 passed, 8 failed ❌

# After tests (all pass)
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
# Result: 25 passed ✅

# Evaluation report
docker compose run --rm app python evaluation/evaluation.py
# Generates: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

**API Stability:**

Public API remained unchanged:
```python
parser = EmailParser()
result = parser.parse(raw_email)
headers = parser.get_headers()  # dict[str, List[str]]
body = parser.get_body()        # str
attachments = parser.get_attachments()  # list[Attachment]
```

**Learn more:**
- Email parser testing strategies: https://mailtrap.io/blog/test-email-parsing/

---

## Summary

This refactoring transformed a fragile regex-based parser into a robust, RFC-compliant implementation through:

1. **Audit** - identified 7 critical bugs
2. **Requirements** - established RFC compliance contract
3. **Architecture** - structured separation of concerns
4. **State machine** - eliminated false boundary matches
5. **RFC 2047** - full encoded-word support
6. **Body decoding** - correct Base64/Quoted-Printable handling
7. **Attachments** - RFC 2231 filename encoding
8. **Error handling** - partial parsing with error codes
9. **Testing** - 25 comprehensive test cases
10. **Verification** - 100% test pass rate + measurable improvements

The result is a production-ready email parser that handles real-world emails from Gmail, Outlook, and Apple Mail without crashes or data corruption.
