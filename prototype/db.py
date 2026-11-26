"""Repository infrastructure. One transactional SQLite database, including files."""
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

def now():
    return datetime.now(timezone.utc).isoformat()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('student','lecturer','admin','advisor')),
 salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS courses (
 id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
 lecturer_id INTEGER NOT NULL REFERENCES users(id));
CREATE TABLE IF NOT EXISTS enrollments (
 course_id INTEGER REFERENCES courses(id), student_id INTEGER REFERENCES users(id),
 PRIMARY KEY(course_id, student_id));
CREATE TABLE IF NOT EXISTS assignments (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
 title TEXT NOT NULL, description TEXT NOT NULL, due_at TEXT NOT NULL,
 max_points INTEGER NOT NULL CHECK(max_points BETWEEN 1 AND 1000),
 policy TEXT NOT NULL CHECK(policy IN ('strict','allow_late')));
CREATE TABLE IF NOT EXISTS submissions (
 id INTEGER PRIMARY KEY, assignment_id INTEGER NOT NULL REFERENCES assignments(id),
 student_id INTEGER NOT NULL REFERENCES users(id), filename TEXT NOT NULL,
 submitted_at TEXT NOT NULL, late INTEGER NOT NULL CHECK(late IN (0,1)),
 status TEXT NOT NULL CHECK(status IN ('submitted','graded')),
 UNIQUE(assignment_id,student_id));
CREATE TABLE IF NOT EXISTS submission_files (
 submission_id INTEGER PRIMARY KEY REFERENCES submissions(id), content BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS feedback (
 submission_id INTEGER PRIMARY KEY REFERENCES submissions(id),
 lecturer_id INTEGER NOT NULL REFERENCES users(id), score INTEGER NOT NULL CHECK(score>=0),
 comment TEXT NOT NULL, released_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 message TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (
 id INTEGER PRIMARY KEY, actor_id INTEGER NOT NULL REFERENCES users(id),
 action TEXT NOT NULL, entity_id INTEGER NOT NULL, created_at TEXT NOT NULL);
"""
class Database:
    def __init__(self, path):
        self.path = Path(path)
    def connect(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        c = sqlite3.connect(self.path, timeout=5)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA foreign_keys = ON")
        return c
    def initialize(self):
        from .identity import password_record
        from contextlib import closing
        with closing(self.connect()) as c, c:
            c.executescript(SCHEMA)
            c.executescript(Path(__file__).with_name('campus_schema.sql').read_text(encoding='utf-8'))
            for uid, username, name, role in [
                (1,'lecturer','Dr. Morgan','lecturer'), (2,'student','Alex Chen','student'),
                (3,'other','Jordan Reed','student'), (4,'admin','Campus Administrator','admin'),
                (5,'advisor','Academic Advisor','advisor'), (6,'lecturer2','Dr. Lee','lecturer')]:
                salt, digest = password_record('DemoOnly!2026')
                c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?)",
                          (uid,username,name,role,salt,digest))
            c.execute("INSERT OR IGNORE INTO courses VALUES (1,'BCS305','Software Architecture',1)")
            c.execute("INSERT OR IGNORE INTO courses VALUES (2,'BCS306','Database Systems',6)")
            c.execute("INSERT OR IGNORE INTO enrollments VALUES (1,2)")
            c.execute("INSERT OR IGNORE INTO enrollments VALUES (2,3)")
            from .campus_seed import seed_campus
            seed_campus(c)
