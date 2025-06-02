#!/usr/bin/env python3
"""
Servidor web simple que sirve index.html automáticamente cuando se accede a la raíz.
"""
import http.server
import socketserver
import os

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Si se solicita la raíz, redirigir a index.html
        if self.path == '/':
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Servidor iniciado en el puerto {PORT}")
    print(f"Abra su navegador y vaya a: http://localhost:{PORT}/")
    print("Para detener el servidor, presione Ctrl+C")
    httpd.serve_forever()
