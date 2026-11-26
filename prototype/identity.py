"""Identity and access: server-derived principals, never browser-supplied roles."""
from dataclasses import dataclass
import hashlib, hmac, secrets, time

class DomainError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status

@dataclass(frozen=True)
class User:
    id: int
    username: str
    name: str
    role: str

def password_record(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 200000).hex()
    return salt, digest

class IdentityService:
    def __init__(self):
        self.sessions = {}
    def authenticate(self, db, username, password):
        row = db.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        salt, digest = password_record(password, row['salt'] if row else '00'*16)
        if not row or not hmac.compare_digest(digest,row['password_hash']):
            raise DomainError('Invalid credentials',401)
        token = secrets.token_urlsafe(32)
        self.sessions[token] = (row['id'],time.monotonic()+3600,secrets.token_urlsafe(24))
        return token
    def resolve(self, db, token):
        s = self.sessions.get(token)
        if not s or s[1] < time.monotonic():
            self.sessions.pop(token,None)
            return None, None
        row = db.execute("SELECT id,username,name,role FROM users WHERE id=?", (s[0],)).fetchone()
        return (User(**dict(row)),s[2]) if row else (None,None)
    def logout(self, token):
        self.sessions.pop(token,None)
