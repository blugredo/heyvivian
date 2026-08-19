#!/usr/bin/env python3
"""Local dev server that always sends Cache-Control: no-store, so browsers
never serve a stale cached copy while iterating on the site."""
import http.server
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    directory = sys.argv[2] if len(sys.argv) > 2 else '.'
    handler = lambda *args: NoCacheHandler(*args, directory=directory)
    http.server.HTTPServer(('', port), handler).serve_forever()
