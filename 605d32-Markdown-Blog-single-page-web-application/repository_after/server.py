#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        pass


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    with ReusableTCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        httpd.serve_forever()
