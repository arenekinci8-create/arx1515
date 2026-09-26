import http.server
import socketserver
import json
import os
import sqlite3
import hashlib
import time
from urllib.parse import urlparse, parse_qs

PORT = 8080
PUBLIC_DIR = "public"
ADMIN_SECRET = "ARX_ADMIN_KEY"

db = sqlite3.connect("arx_data.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, name TEXT, created_at TEXT)")
db.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, name TEXT, text TEXT, time TEXT, from_admin INTEGER DEFAULT 0)")
db.execute("CREATE TABLE IF NOT EXISTS admin_session (token TEXT PRIMARY KEY)")
db.commit()

def get_db():
    return db

class ARXHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/api/messages":
            self.handle_get_messages(parsed)
        elif parsed.path == "/api/stats":
            self.handle_stats()
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length else b''
        
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            data = {}

        if parsed.path == "/api/send":
            self.handle_send_message(data)
        elif parsed.path == "/api/admin/login":
            self.handle_admin_login(data)
        elif parsed.path == "/api/admin/reply":
            self.handle_admin_reply(data)
        elif parsed.path == "/api/admin/delete":
            self.handle_admin_delete(data)
        else:
            self.send_error(404)

    def handle_send_message(self, data):
        uid = data.get("uid", "")
        name = data.get("name", "Anonim")
        text = data.get("text", "").strip()
        
        if not uid or not text:
            self.send_json(400, {"error": "uid ve text gerekli"})
            return
        
        now = time.strftime("%H:%M")
        get_db().execute("INSERT INTO messages (uid, name, text, time, from_admin) VALUES (?, ?, ?, ?, 0)", 
                        (uid, name[:20], text[:500], now))
        get_db().commit()
        
        self.send_json(200, {"ok": True, "time": now})

    def handle_get_messages(self, parsed):
        params = parse_qs(parsed.query)
        uid = params.get("uid", [""])[0]
        admin = params.get("admin", ["0"])[0]
        
        if admin == "1":
            rows = get_db().execute("SELECT uid, name, text, time, from_admin FROM messages ORDER BY id DESC LIMIT 100").fetchall()
        elif uid:
            rows = get_db().execute("SELECT uid, name, text, time, from_admin FROM messages WHERE uid=? ORDER BY id DESC LIMIT 50", (uid,)).fetchall()
        else:
            rows = []
        
        msgs = [{"uid": r[0], "name": r[1], "text": r[2], "time": r[3], "fromAdmin": bool(r[4])} for r in reversed(rows)]
        self.send_json(200, {"messages": msgs})

    def handle_admin_login(self, data):
        key = data.get("key", "")
        if key == ADMIN_SECRET:
            token = hashlib.md5(str(time.time()).encode()).hexdigest()
            get_db().execute("INSERT OR REPLACE INTO admin_session (token) VALUES (?)", (token,))
            get_db().commit()
            self.send_json(200, {"ok": True, "token": token})
        else:
            self.send_json(403, {"error": "Yanlis anahtar"})

    def handle_admin_reply(self, data):
        token = data.get("token", "")
        uid = data.get("target_uid", "")
        text = data.get("text", "").strip()
        
        if not self.check_admin(token):
            self.send_json(403, {"error": "Admin degilsin"})
            return
        if not uid or not text:
            self.send_json(400, {"error": "uid ve text gerekli"})
            return
        
        now = time.strftime("%H:%M")
        get_db().execute("INSERT INTO messages (uid, name, text, time, from_admin) VALUES (?, ?, ?, ?, 1)",
                        (uid, "Admin", text[:500], now))
        get_db().commit()
        
        self.send_json(200, {"ok": True, "time": now})

    def handle_admin_delete(self, data):
        token = data.get("token", "")
        msg_id = data.get("id")
        
        if not self.check_admin(token):
            self.send_json(403, {"error": "Admin degilsin"})
            return
        
        get_db().execute("DELETE FROM messages WHERE id=?", (msg_id,))
        get_db().commit()
        self.send_json(200, {"ok": True})

    def handle_stats(self):
        user_count = get_db().execute("SELECT COUNT(DISTINCT uid) FROM messages").fetchone()[0]
        msg_count = get_db().execute("SELECT COUNT(*) FROM messages").fetchone()[0]
        self.send_json(200, {"users": user_count, "messages": msg_count})

    def check_admin(self, token):
        if not token:
            return False
        row = get_db().execute("SELECT token FROM admin_session WHERE token=?", (token,)).fetchone()
        return row is not None

    def send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def log_message(self, format, *args):
        print(f"[ARX] {args[0]}")

if __name__ == "__main__":
    print("=" * 50)
    print("  ARX SERVER")
    print("=" * 50)
    print(f"  Site:    http://localhost:{PORT}")
    print(f"  Admin:   http://localhost:{PORT}/arx.web.html?adm=1")
    print(f"  Stats:   http://localhost:{PORT}/api/stats")
    print(f"  Secret:  {ADMIN_SECRET}")
    print("=" * 50)
    
    with socketserver.TCPServer(("0.0.0.0", PORT), ARXHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[ARX] Server kapatildi.")
