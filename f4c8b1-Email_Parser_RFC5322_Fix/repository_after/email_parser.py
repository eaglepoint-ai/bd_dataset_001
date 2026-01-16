import re
import base64
import quopri
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ParseError:
    """Error codes for email parsing"""
    INVALID_HEADER = "INVALID_HEADER"
    DECODE_ERROR = "DECODE_ERROR"
    BOUNDARY_ERROR = "BOUNDARY_ERROR"
    CHARSET_ERROR = "CHARSET_ERROR"


@dataclass
class ParseResult:
    headers: Dict[str, List[str]]  # Changed to List to support multiple values
    body: str
    html_body: Optional[str]
    attachments: List[Dict]
    errors: List[str]


class EmailParser:
    """Parse RFC 5322 compliant emails with proper error handling"""
    
    def __init__(self):
        self.errors = []
        self.parsed_headers = {}
        self.parsed_body = ''
        self.parsed_html_body = None
        self.parsed_attachments = []
    
    def parse(self, raw_email: bytes) -> ParseResult:
        """Parse raw email bytes into structured data"""
        self.errors = []
        
        # Try UTF-8 first, fallback to other charsets
        try:
            text = raw_email.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = raw_email.decode('iso-8859-1')
            except:
                text = raw_email.decode('latin-1', errors='replace')
        
        # Split headers and body (handle both CRLF and LF)
        headers_text, body = self._split_headers_body(text)
        parsed_headers = self._parse_headers(headers_text)
        
        # Get content type
        content_type_list = parsed_headers.get('content-type', ['text/plain'])
        content_type = content_type_list[0] if content_type_list else 'text/plain'
        
        # Parse based on content type
        if 'multipart' in content_type.lower():
            parts = self._parse_multipart(body, content_type)
            text_body, html_body, attachments = self._extract_parts(parts, parsed_headers)
        else:
            # Single part email
            encoding = self._get_header_param(parsed_headers, 'content-transfer-encoding', '7bit')
            charset = self._extract_charset(content_type)
            text_body = self._decode_body(body, encoding, charset)
            html_body = None
            attachments = []
        
        # Store for get_* methods
        self.parsed_headers = parsed_headers
        self.parsed_body = text_body
        self.parsed_html_body = html_body
        self.parsed_attachments = attachments
        
        return ParseResult(
            headers=parsed_headers,
            body=text_body,
            html_body=html_body,
            attachments=attachments,
            errors=self.errors
        )
    
    def _split_headers_body(self, text: str) -> Tuple[str, str]:
        """Split email into headers and body at blank line (handle CRLF and LF)"""
        # Try CRLF first
        if '\r\n\r\n' in text:
            parts = text.split('\r\n\r\n', 1)
            return parts[0], parts[1] if len(parts) > 1 else ''
        # Fallback to LF
        elif '\n\n' in text:
            parts = text.split('\n\n', 1)
            return parts[0], parts[1] if len(parts) > 1 else ''
        else:
            # No blank line found
            self.errors.append(f"{ParseError.INVALID_HEADER}: No blank line between headers and body")
            return text, ''
    
    def _parse_headers(self, header_text: str) -> Dict[str, List[str]]:
        """Parse headers with support for folding and multiple values"""
        headers = {}
        
        # Normalize line endings
        header_text = header_text.replace('\r\n', '\n')
        lines = header_text.split('\n')
        
        current_header = None
        current_value = []
        
        for line in lines:
            # Continuation line (starts with space or tab)
            if line and line[0] in (' ', '\t'):
                if current_header:
                    current_value.append(line.strip())
            # New header
            elif ':' in line:
                # Save previous header
                if current_header:
                    full_value = ' '.join(current_value)
                    decoded_value = self._decode_header_value(full_value)
                    headers[current_header].append(decoded_value)
                
                # Parse new header
                key, value = line.split(':', 1)
                current_header = key.strip().lower()
                current_value = [value.strip()]
                
                if current_header not in headers:
                    headers[current_header] = []
        
        # Save last header
        if current_header and current_value:
            full_value = ' '.join(current_value)
            decoded_value = self._decode_header_value(full_value)
            headers[current_header].append(decoded_value)
        
        return headers
    
    def _decode_header_value(self, value: str) -> str:
        """Decode RFC 2047 encoded-words in header (supports multiple encoded words)"""
        if '=?' not in value:
            return value
        
        # Pattern for RFC 2047 encoded-word: =?charset?encoding?encoded-text?=
        pattern = r'=\?([^?]+)\?([BQbq])\?([^?]+)\?='
        
        def decode_match(match):
            charset, encoding, encoded = match.groups()
            encoding = encoding.upper()
            
            try:
                if encoding == 'B':
                    # Base64 encoding
                    decoded_bytes = base64.b64decode(encoded)
                    return decoded_bytes.decode(charset, errors='replace')
                elif encoding == 'Q':
                    # Quoted-printable encoding
                    # Replace underscore with space (RFC 2047 specific)
                    encoded = encoded.replace('_', ' ')
                    # Decode quoted-printable
                    decoded_bytes = quopri.decodestring(encoded.encode('ascii'))
                    return decoded_bytes.decode(charset, errors='replace')
            except Exception as e:
                self.errors.append(f"{ParseError.DECODE_ERROR}: Header decode failed: {e}")
                return match.group(0)  # Return original if decode fails
            
            return match.group(0)
        
        # Replace all encoded-words
        decoded = re.sub(pattern, decode_match, value)
        return decoded
    
    def _parse_multipart(self, body: str, content_type: str) -> List[Dict]:
        """Parse multipart email using state machine (no regex for boundaries)"""
        # Extract boundary
        boundary = self._extract_boundary(content_type)
        if not boundary:
            self.errors.append(f"{ParseError.BOUNDARY_ERROR}: No boundary found")
            return []
        
        return self._parse_multipart_state_machine(body, boundary)
    
    def _extract_boundary(self, content_type: str) -> Optional[str]:
        """Extract boundary from Content-Type header"""
        # Handle both quoted and unquoted boundaries
        match = re.search(r'boundary\s*=\s*"([^"]+)"', content_type, re.IGNORECASE)
        if match:
            return match.group(1)
        
        match = re.search(r'boundary\s*=\s*([^\s;]+)', content_type, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _parse_multipart_state_machine(self, body: str, boundary: str) -> List[Dict]:
        """State machine to parse multipart with proper boundary handling"""
        # Normalize line endings
        body = body.replace('\r\n', '\n')
        lines = body.split('\n')
        
        # States
        SEEKING_BOUNDARY = 0
        IN_HEADERS = 1
        IN_BODY = 2
        
        state = SEEKING_BOUNDARY
        parts = []
        current_part_headers = []
        current_part_body = []
        
        boundary_start = '--' + boundary
        boundary_end = '--' + boundary + '--'
        
        for line in lines:
            if state == SEEKING_BOUNDARY:
                if line.strip() == boundary_start:
                    state = IN_HEADERS
                    current_part_headers = []
                    current_part_body = []
                elif line.strip() == boundary_end:
                    break  # End of multipart
            
            elif state == IN_HEADERS:
                if line.strip() == '':
                    # Empty line = end of headers
                    state = IN_BODY
                elif line.strip() == boundary_start or line.strip() == boundary_end:
                    # Boundary without body (empty part)
                    if current_part_headers:
                        parts.append({
                            'headers': self._parse_headers('\n'.join(current_part_headers)),
                            'body': ''
                        })
                    current_part_headers = []
                    current_part_body = []
                    state = IN_HEADERS if line.strip() == boundary_start else SEEKING_BOUNDARY
                else:
                    current_part_headers.append(line)
            
            elif state == IN_BODY:
                if line.strip() == boundary_start:
                    # Save current part
                    parts.append({
                        'headers': self._parse_headers('\n'.join(current_part_headers)),
                        'body': '\n'.join(current_part_body)
                    })
                    # Start new part
                    current_part_headers = []
                    current_part_body = []
                    state = IN_HEADERS
                elif line.strip() == boundary_end:
                    # Save current part and end
                    parts.append({
                        'headers': self._parse_headers('\n'.join(current_part_headers)),
                        'body': '\n'.join(current_part_body)
                    })
                    # Don't process more lines after end boundary
                    state = SEEKING_BOUNDARY
                    break
                else:
                    current_part_body.append(line)
        
        # Don't save last part if we already ended with a boundary
        # (This prevents duplicates)
        
        return parts
    
    def _extract_parts(self, parts: List[Dict], parent_headers: Dict) -> Tuple[str, Optional[str], List[Dict]]:
        """Extract text, HTML, and attachments from parts (handles nested multipart)"""
        text_body = ''
        html_body = None
        attachments = []
        
        for part in parts:
            content_type_list = part['headers'].get('content-type', ['text/plain'])
            content_type = content_type_list[0] if content_type_list else 'text/plain'
            
            disposition_list = part['headers'].get('content-disposition', [''])
            disposition = disposition_list[0] if disposition_list else ''
            
            # Check if this part is multipart (nested)
            if 'multipart' in content_type.lower():
                boundary = self._extract_boundary(content_type)
                if boundary:
                    nested_parts = self._parse_multipart_state_machine(part['body'], boundary)
                    nested_text, nested_html, nested_attachments = self._extract_parts(nested_parts, part['headers'])
                    if nested_text:
                        text_body = nested_text
                    if nested_html:
                        html_body = nested_html
                    attachments.extend(nested_attachments)
                continue
            
            # Extract encoding and charset
            encoding = self._get_header_param(part['headers'], 'content-transfer-encoding', '7bit')
            charset = self._extract_charset(content_type)
            
            # Decode body
            decoded_body = self._decode_body(part['body'], encoding, charset)
            
            # Classify part
            if 'attachment' in disposition.lower():
                # Attachment
                filename = self._extract_filename(disposition)
                if not filename:
                    # Try Content-Type filename parameter
                    filename = self._extract_filename_from_content_type(content_type)
                
                attachments.append({
                    'filename': filename or 'unknown',
                    'content_type': content_type,
                    'data': decoded_body,
                    'content_id': self._get_header_param(part['headers'], 'content-id', '')
                })
            elif 'text/plain' in content_type.lower():
                if not text_body:  # Use first text/plain found
                    text_body = decoded_body
            elif 'text/html' in content_type.lower():
                if not html_body:  # Use first text/html found
                    html_body = decoded_body
            elif 'inline' in disposition.lower() or part['headers'].get('content-id'):
                # Inline attachment
                filename = self._extract_filename(disposition) or 'inline'
                attachments.append({
                    'filename': filename,
                    'content_type': content_type,
                    'data': decoded_body,
                    'content_id': self._get_header_param(part['headers'], 'content-id', ''),
                    'inline': True
                })
        
        return text_body, html_body, attachments
    
    def _decode_body(self, body: str, encoding: str, charset: str) -> str:
        """Decode body based on Content-Transfer-Encoding and charset"""
        encoding = encoding.lower().strip()
        
        try:
            if encoding == 'base64':
                # Remove line breaks and whitespace
                clean_body = body.replace('\n', '').replace('\r', '').replace(' ', '')
                if clean_body:
                    decoded_bytes = base64.b64decode(clean_body)
                else:
                    decoded_bytes = b''
                
            elif encoding == 'quoted-printable':
                # Decode quoted-printable
                decoded_bytes = quopri.decodestring(body.encode('latin-1'))
                
            else:
                # 7bit, 8bit, binary
                decoded_bytes = body.encode('latin-1', errors='replace')
            
            # Convert to string with charset
            return self._decode_with_charset(decoded_bytes, charset)
            
        except Exception as e:
            self.errors.append(f"{ParseError.DECODE_ERROR}: Body decode failed: {e}")
            return body
    
    def _decode_with_charset(self, data: bytes, charset: str) -> str:
        """Decode bytes with charset, trying fallbacks if needed"""
        if not charset:
            charset = 'utf-8'
        
        # Normalize charset name
        charset = charset.lower().strip()
        
        # Try specified charset
        try:
            return data.decode(charset)
        except (UnicodeDecodeError, LookupError):
            pass
        
        # Try common fallbacks
        fallback_charsets = ['utf-8', 'iso-8859-1', 'windows-1252', 'latin-1']
        for fallback in fallback_charsets:
            if fallback == charset:
                continue
            try:
                return data.decode(fallback)
            except (UnicodeDecodeError, LookupError):
                continue
        
        # Last resort: decode with replacement
        self.errors.append(f"{ParseError.CHARSET_ERROR}: Failed to decode with charset '{charset}'")
        return data.decode('utf-8', errors='replace')
    
    def _extract_charset(self, content_type: str) -> str:
        """Extract charset from Content-Type header"""
        match = re.search(r'charset\s*=\s*"?([^\s";]+)"?', content_type, re.IGNORECASE)
        if match:
            return match.group(1)
        return 'utf-8'  # Default
    
    def _extract_filename(self, disposition: str) -> Optional[str]:
        """Extract filename from Content-Disposition with RFC 2231 support"""
        # Simple quoted filename
        match = re.search(r'filename\s*=\s*"([^"]+)"', disposition, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Unquoted filename
        match = re.search(r'filename\s*=\s*([^\s;]+)', disposition, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # RFC 2231 encoded filename: filename*=charset'lang'encoded
        match = re.search(r"filename\*\s*=\s*([^']+)'[^']*'(.+)", disposition, re.IGNORECASE)
        if match:
            charset, encoded = match.groups()
            try:
                # URL decode
                import urllib.parse
                decoded = urllib.parse.unquote(encoded, encoding=charset)
                return decoded
            except:
                return encoded
        
        return None
    
    def _extract_filename_from_content_type(self, content_type: str) -> Optional[str]:
        """Extract filename from Content-Type (some emails put it there)"""
        match = re.search(r'name\s*=\s*"([^"]+)"', content_type, re.IGNORECASE)
        if match:
            return match.group(1)
        
        match = re.search(r'name\s*=\s*([^\s;]+)', content_type, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _get_header_param(self, headers: Dict[str, List[str]], key: str, default: str) -> str:
        """Get first value of header parameter"""
        values = headers.get(key.lower(), [default])
        return values[0] if values else default
    
    def get_headers(self) -> Dict[str, List[str]]:
        """Get parsed headers"""
        return self.parsed_headers
    
    def get_body(self) -> str:
        """Get email body"""
        return self.parsed_body
    
    def get_attachments(self) -> List[Dict]:
        """Get attachments"""
        return self.parsed_attachments
