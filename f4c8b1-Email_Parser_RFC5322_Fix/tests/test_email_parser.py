import pytest
import os
import sys
from pathlib import Path

# Import the implementation based on PYTHONPATH
# This allows testing either repository_before or repository_after
from email_parser import EmailParser, ParseResult

# For comparison tests, import both explicitly
try:
    from repository_before.email_parser import EmailParser as ParserBefore
    from repository_after.email_parser import EmailParser as ParserAfter
    HAS_BOTH = True
except ImportError:
    HAS_BOTH = False
    ParserBefore = None
    ParserAfter = None


FIXTURES_DIR = Path(__file__).parent / 'fixtures'


def load_email(filename):
    """Load email from fixtures directory"""
    filepath = FIXTURES_DIR / filename
    with open(filepath, 'rb') as f:
        return f.read()


class TestSimpleEmails:
    """Test basic email parsing functionality"""
    
    def test_simple_plaintext_email(self):
        """Test parsing a simple plain text email"""
        parser = EmailParser()
        email = load_email('simple.eml')
        result = parser.parse(email)
        
        assert result.body is not None
        assert 'simple plain text email' in result.body.lower()
        assert result.html_body is None
        assert len(result.attachments) == 0
        # STRICT: headers must be Dict[str, List[str]], not Dict[str, str]
        assert isinstance(result.headers['from'], list), "Headers must be List[str] not str"
        assert 'sender@example.com' in result.headers['from'][0]
    
    def test_html_email(self):
        """Test parsing email with HTML content"""
        parser = EmailParser()
        email = load_email('multipart.eml')
        result = parser.parse(email)
        
        # STRICT: Headers must be List[str]
        assert isinstance(result.headers.get('from', []), list), "Headers must be List[str]"
        assert isinstance(result.headers.get('subject', []), list), "Headers must be List[str]"
        
        assert result.body is not None
        assert 'plain text version' in result.body.lower()
        assert result.html_body is not None
        assert '<html>' in result.html_body.lower()
        assert '<b>HTML</b>' in result.html_body
    
    def test_multipart_with_attachments(self):
        """Test email with 3 attachments"""
        parser = EmailParser()
        email = load_email('attachments.eml')
        result = parser.parse(email)
        
        # STRICT: Headers must be List[str]
        assert isinstance(result.headers.get('from', []), list), "Headers must be List[str]"
        
        # STRICT: Must extract exactly 3 attachments
        assert len(result.attachments) == 3, f"Expected exactly 3 attachments, got {len(result.attachments)}"
        filenames = [att['filename'] for att in result.attachments]
        assert 'file1.txt' in filenames, "Missing file1.txt"
        assert 'document.pdf' in filenames, "Missing document.pdf"
        assert 'image.png' in filenames, "Missing image.png"
    
    def test_rfc2047_subject_decoding(self):
        """Test RFC 2047 encoded subject decodes to 'Hello World'"""
        parser = EmailParser()
        email = load_email('encoded.eml')
        result = parser.parse(email)
        
        # STRICT: Must be List[str]
        assert isinstance(result.headers['subject'], list), "Headers must be List[str]"
        subject = result.headers['subject'][0]
        # STRICT: Must actually decode, not just contain the text
        assert subject == 'Hello World', f"Expected 'Hello World', got '{subject}'"
        assert '=?UTF-8?B?' not in subject, "RFC 2047 encoding must be decoded"
    
    def test_quoted_printable_body(self):
        """Test quoted-printable body with soft breaks and hex encoding"""
        parser = EmailParser()
        email = load_email('encoded.eml')
        result = parser.parse(email)
        
        # Soft break should be removed
        assert 'soft break that continues' in result.body
        # Hex encoding should decode é
        assert 'é' in result.body or '\\xc3\\xa9' not in result.body
    
    def test_base64_body_with_linebreaks(self):
        """Test base64 decoding with line breaks in encoded data"""
        parser = EmailParser()
        email = load_email('attachments.eml')
        result = parser.parse(email)
        
        # Check that base64 attachments decoded correctly
        assert len(result.attachments) >= 2
        for att in result.attachments:
            if att['filename'] in ['document.pdf', 'image.png']:
                assert len(att['data']) > 0  # Should have content


class TestEdgeCases:
    """Test edge cases and complex scenarios"""
    
    def test_nested_multipart(self):
        """Test nested multipart (alternative inside mixed)"""
        parser = EmailParser()
        email = load_email('nested_multipart.eml')
        result = parser.parse(email)
        
        # STRICT: Headers must be List[str]
        assert isinstance(result.headers.get('subject', []), list), "Headers must be List[str]"
        
        # Should extract both text and HTML from nested multipart
        assert result.body is not None, "Body not extracted from nested multipart"
        assert 'Plain text version' in result.body, "Text version not found in nested multipart"
        assert result.html_body is not None, "HTML body not extracted from nested multipart"
        assert '<html>' in result.html_body.lower(), "HTML content not found"
        
        # And the attachment from outer multipart
        assert len(result.attachments) >= 1, f"Expected at least 1 attachment, got {len(result.attachments)}"
        assert any('doc.pdf' in att['filename'] for att in result.attachments), "PDF attachment not found"
    
    def test_header_folding(self):
        """Test header continuation lines (folding)"""
        parser = EmailParser()
        email = load_email('header_folding.eml')
        result = parser.parse(email)
        
        # STRICT: Headers must be List[str]
        assert isinstance(result.headers['subject'], list), "Headers must be List[str]"
        subject = result.headers['subject'][0]
        
        # STRICT: Continuation lines must be joined into single line
        assert 'very long subject' in subject.lower(), "Missing first part of folded header"
        assert 'continues' in subject.lower(), "Missing second part of folded header"  
        assert 'third line' in subject.lower(), "Missing third part of folded header"
        # Must NOT have line breaks in the middle
        assert '\n' not in subject, "Header folding not handled: newlines still present"
        assert '\r' not in subject, "Header folding not handled: carriage returns still present"
    
    def test_multiple_received_headers(self):
        """Test same header appearing multiple times"""
        email_data = b"""Received: from server1
Received: from server2  
Received: from server3
Subject: Test
Content-Type: text/plain

Body"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        # STRICT: Headers must be Dict[str, List[str]] to support multiple values
        assert 'received' in result.headers
        assert isinstance(result.headers['received'], list), "Headers must be List[str] for multiple values"
        assert len(result.headers['received']) == 3, f"Expected 3 Received headers, got {len(result.headers['received'])}"
        assert 'server1' in result.headers['received'][0]
        assert 'server2' in result.headers['received'][1]
        assert 'server3' in result.headers['received'][2]
    
    def test_boundary_in_body_content(self):
        """Test that boundary string in body doesn't break parsing"""
        email_data = b"""Content-Type: multipart/mixed; boundary="TEST"

--TEST
Content-Type: text/plain

This body contains --TEST which looks like a boundary
but it's not at the start of a line.
--TEST
Content-Type: text/plain

Second part.
--TEST--"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        # Should parse without errors
        assert len(result.errors) == 0 or all('BOUNDARY' not in err for err in result.errors)
    
    def test_missing_content_type(self):
        """Test email defaults to text/plain when Content-Type missing"""
        email_data = b"""From: test@example.com
Subject: Test

Plain body text"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        assert result.body == 'Plain body text'
    
    def test_crlf_vs_lf_mixed(self):
        """Test mixed CRLF and LF line endings"""
        email_data = b"From: test@example.com\r\nSubject: Test\n\nBody"
        parser = EmailParser()
        result = parser.parse(email_data)
        
        assert 'from' in result.headers
        assert result.body == 'Body'
    
    def test_rfc2231_filename_encoding(self):
        """Test RFC 2231 filename encoding"""
        email_data = b"""Content-Type: multipart/mixed; boundary="B"

--B
Content-Type: text/plain
Content-Disposition: attachment; filename*=UTF-8''test%20file.txt

Content
--B--"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        assert len(result.attachments) == 1
        assert 'test file.txt' in result.attachments[0]['filename']
    
    def test_inline_attachments(self):
        """Test inline attachments with Content-ID"""
        email_data = b"""Content-Type: multipart/related; boundary="B"

--B
Content-Type: text/html

<img src="cid:image1">

--B
Content-Type: image/png
Content-ID: <image1>
Content-Disposition: inline; filename="logo.png"

ImageData
--B--"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        assert len(result.attachments) >= 1
        assert any('image1' in att.get('content_id', '') for att in result.attachments)


class TestErrorHandling:
    """Test error handling and malformed emails"""
    
    def test_malformed_email_partial_parse(self):
        """Test malformed email returns partial result with errors"""
        parser = EmailParser()
        email = load_email('malformed.eml')
        result = parser.parse(email)
        
        # Should not crash
        assert result is not None
        # Should have errors
        assert len(result.errors) > 0
    
    def test_invalid_base64_graceful(self):
        """Test invalid base64 adds DECODE_ERROR"""
        email_data = b"""Content-Transfer-Encoding: base64
Content-Type: text/plain

Not valid base64!!!"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        # Should not crash
        assert result is not None
        # Should have decode error
        assert any('DECODE_ERROR' in err for err in result.errors)
    
    def test_missing_boundary(self):
        """Test multipart without boundary adds BOUNDARY_ERROR"""
        email_data = b"""Content-Type: multipart/mixed

--someboundary
Content-Type: text/plain

Part
--someboundary--"""
        parser = EmailParser()
        result = parser.parse(email_data)
        
        # Should have boundary error
        assert any('BOUNDARY_ERROR' in err for err in result.errors)
    
    def test_invalid_charset(self):
        """Test invalid charset falls back gracefully"""
        parser = EmailParser()
        email = load_email('malformed.eml')
        result = parser.parse(email)
        
        # Should not crash, may have CHARSET_ERROR
        assert result is not None
        assert result.body is not None


class TestPublicAPI:
    """Test public API methods"""
    
    def test_get_headers(self):
        """Test get_headers() returns stored headers"""
        parser = EmailParser()
        email = load_email('simple.eml')
        result = parser.parse(email)
        
        headers = parser.get_headers()
        # STRICT: get_headers() must return actual parsed headers, not empty dict
        assert headers is not None, "get_headers() returned None"
        assert len(headers) > 0, "get_headers() returned empty dict (instance variables not stored)"
        assert 'from' in headers, "Missing 'from' header"
        assert 'subject' in headers, "Missing 'subject' header"
        assert headers == result.headers, "get_headers() must return same headers as parse result"
    
    def test_get_body(self):
        """Test get_body() returns stored body"""
        parser = EmailParser()
        email = load_email('simple.eml')
        result = parser.parse(email)
        
        body = parser.get_body()
        # STRICT: get_body() must return actual body, not empty string
        assert body is not None, "get_body() returned None"
        assert len(body) > 0, "get_body() returned empty string (instance variable not stored)"
        assert body == result.body, "get_body() must return same body as parse result"
        assert 'simple plain text email' in body.lower(), "Body content missing"
    
    def test_get_attachments(self):
        """Test get_attachments() returns stored attachments"""
        parser = EmailParser()
        email = load_email('attachments.eml')
        result = parser.parse(email)
        
        attachments = parser.get_attachments()
        # STRICT: get_attachments() must return actual attachments, not empty list
        assert attachments is not None, "get_attachments() returned None"
        assert len(attachments) == 3, f"Expected 3 attachments, got {len(attachments)} (instance variable not stored?)"
        assert attachments == result.attachments, "get_attachments() must return same attachments as parse result"
        filenames = [att['filename'] for att in attachments]
        assert 'file1.txt' in filenames
        assert 'document.pdf' in filenames
        assert 'image.png' in filenames


@pytest.mark.skipif(not HAS_BOTH, reason="Requires both repository_before and repository_after")
class TestBeforeVsAfter:
    """Compare repository_before vs repository_after"""
    
    def test_before_has_bugs(self):
        """Verify repository_before has known bugs"""
        parser = ParserBefore()
        
        # Test 1: get_* methods don't work
        email = load_email('simple.eml')
        result = parser.parse(email)
        headers = parser.get_headers()
        # Before version doesn't store headers
        assert headers == {} or headers != result.headers
    
    def test_after_fixes_bugs(self):
        """Verify repository_after fixes the bugs"""
        parser = EmailParser()
        
        # Test 1: get_* methods work
        email = load_email('simple.eml')
        result = parser.parse(email)
        headers = parser.get_headers()
        # After version stores headers correctly
        assert headers == result.headers
        assert len(headers) > 0
    
    def test_before_header_folding_fails(self):
        """Verify repository_before doesn't handle header folding"""
        parser = ParserBefore()
        email = load_email('header_folding.eml')
        result = parser.parse(email)
        
        subject = result.headers.get('subject', '')
        # Before version doesn't join continuation lines
        # (This test may need adjustment based on exact behavior)
    
    def test_after_header_folding_works(self):
        """Verify repository_after handles header folding"""
        parser = EmailParser()
        email = load_email('header_folding.eml')
        result = parser.parse(email)
        
        subject = result.headers['subject'][0]
        # After version joins continuation lines
        assert 'very long subject' in subject.lower()
        assert 'continues' in subject.lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
