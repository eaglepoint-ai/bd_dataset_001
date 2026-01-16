import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ParseResult:
    headers: Dict[str, str]
    body: str
    html_body: Optional[str]
    attachments: List[Dict]
    errors: List[str]


class EmailParser:
    """Parse RFC 5322 compliant emails"""
    
    def __init__(self):
        self.errors = []
    
    def parse(self, raw_email: bytes) -> ParseResult:
        """Parse raw email bytes into structured data"""
        self.errors = []
        
        try:
            text = raw_email.decode('utf-8')
        except:
            text = raw_email.decode('latin-1')
        
        headers, body = self._split_headers_body(text)
        parsed_headers = self._parse_headers(headers)
        
        content_type = parsed_headers.get('content-type', 'text/plain')
        
        if 'multipart' in content_type:
            parts = self._parse_multipart(body, content_type)
            text_body, html_body, attachments = self._extract_parts(parts)
        else:
            text_body = self._decode_body(body, parsed_headers)
            html_body = None
            attachments = []
        
        return ParseResult(
            headers=parsed_headers,
            body=text_body,
            html_body=html_body,
            attachments=attachments,
            errors=self.errors
        )
    
    def _split_headers_body(self, text: str) -> Tuple[str, str]:
        """Split email into headers and body at blank line"""
        parts = text.split('\n\n')
        return parts[0], parts[1] if len(parts) > 1 else ''
    
    def _parse_headers(self, header_text: str) -> Dict[str, str]:
        """Parse headers into dictionary"""
        headers = {}
        
        for line in header_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                headers[key.lower()] = value.strip()
        
        return headers
    
    def _decode_header_value(self, value: str) -> str:
        """Decode RFC 2047 encoded header values"""
        if '=?' not in value:
            return value
        
        match = re.search(r'=\?([^?]+)\?([BQ])\?([^?]+)\?=', value)
        if match:
            charset, encoding, encoded = match.groups()
            if encoding == 'B':
                import base64
                return base64.b64decode(encoded).decode(charset)
            elif encoding == 'Q':
                return encoded.replace('_', ' ')
        
        return value
    
    def _parse_multipart(self, body: str, content_type: str) -> List[Dict]:
        """Parse multipart email into parts"""
        boundary_match = re.search(r'boundary="([^"]+)"', content_type)
        if not boundary_match:
            return []
        
        boundary = boundary_match.group(1)
        parts = body.split('--' + boundary)
        
        result = []
        for part in parts[1:]:
            if part.startswith('--'):
                continue
            
            part_headers, part_body = self._split_headers_body(part)
            result.append({
                'headers': self._parse_headers(part_headers),
                'body': part_body
            })
        
        return result
    
    def _extract_parts(self, parts: List[Dict]) -> Tuple[str, Optional[str], List[Dict]]:
        """Extract text, HTML, and attachments from parts"""
        text_body = ''
        html_body = None
        attachments = []
        
        for part in parts:
            content_type = part['headers'].get('content-type', 'text/plain')
            disposition = part['headers'].get('content-disposition', '')
            
            if 'attachment' in disposition:
                filename = re.search(r'filename="([^"]+)"', disposition)
                attachments.append({
                    'filename': filename.group(1) if filename else 'unknown',
                    'content_type': content_type,
                    'data': part['body']
                })
            elif 'text/plain' in content_type:
                text_body = part['body']
            elif 'text/html' in content_type:
                html_body = part['body']
        
        return text_body, html_body, attachments
    
    def _decode_body(self, body: str, headers: Dict) -> str:
        """Decode body based on Content-Transfer-Encoding"""
        encoding = headers.get('content-transfer-encoding', '7bit')
        
        if encoding == 'base64':
            import base64
            return base64.b64decode(body).decode('utf-8')
        elif encoding == 'quoted-printable':
            return body.replace('=\n', '')
        
        return body
    
    def get_headers(self) -> Dict[str, str]:
        """Get parsed headers"""
        return self.headers if hasattr(self, 'headers') else {}
    
    def get_body(self) -> str:
        """Get email body"""
        return self.body if hasattr(self, 'body') else ''
    
    def get_attachments(self) -> List[Dict]:
        """Get attachments"""
        return self.attachments if hasattr(self, 'attachments') else []


