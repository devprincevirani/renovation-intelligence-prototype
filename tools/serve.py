"""Local preview server for the prototype that never lets the browser cache files.
Run from the prototype folder:  python3 tools/serve.py  (then open http://127.0.0.1:4173/)
Plain `python3 -m http.server` lets browsers keep old copies of JS and CSS, so changes can look like they did not apply."""
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

with Server(('127.0.0.1', PORT), NoCache) as httpd:
    print('Serving the prototype at http://127.0.0.1:%d/ (no caching)' % PORT, flush=True)
    httpd.serve_forever()
