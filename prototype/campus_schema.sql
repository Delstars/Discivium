-- Campus modules: separate ownership, same transaction store.
CREATE TABLE IF NOT EXISTS offerings (
 course_id INTEGER PRIMARY KEY REFERENCES courses(id), credits INTEGER NOT NULL CHECK(credits BETWEEN 1 AND 6),
 capacity INTEGER NOT NULL CHECK(capacity>0), weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 start_min INTEGER NOT NULL, end_min INTEGER NOT NULL CHECK(end_min>start_min AND end_min<=1440),
 room TEXT NOT NULL, semester TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prerequisites (
 course_id INTEGER REFERENCES courses(id), required_course_id INTEGER REFERENCES courses(id),
 PRIMARY KEY(course_id,required_course_id), CHECK(course_id<>required_course_id));
CREATE TABLE IF NOT EXISTS course_results (
 student_id INTEGER REFERENCES users(id), course_id INTEGER REFERENCES courses(id),
 percentage REAL NOT NULL CHECK(percentage BETWEEN 0 AND 100), credits INTEGER NOT NULL,
 released_at TEXT NOT NULL, PRIMARY KEY(student_id,course_id));
CREATE TABLE IF NOT EXISTS attendance_sessions (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
 session_date TEXT NOT NULL, title TEXT NOT NULL, UNIQUE(course_id,session_date,title));
CREATE TABLE IF NOT EXISTS attendance (
 session_id INTEGER REFERENCES attendance_sessions(id), student_id INTEGER REFERENCES users(id),
 status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')),
 PRIMARY KEY(session_id,student_id));
CREATE TABLE IF NOT EXISTS invoices (
 id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL,
 amount_fils INTEGER NOT NULL CHECK(amount_fils>0), due_date TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS payments (
 id INTEGER PRIMARY KEY, invoice_id INTEGER NOT NULL UNIQUE REFERENCES invoices(id),
 amount_fils INTEGER NOT NULL CHECK(amount_fils>0), recorded_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS service_requests (
 id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id),
 category TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','in_review','resolved','rejected','cancelled')),
 decision TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS advisor_assignments (
 student_id INTEGER REFERENCES users(id), advisor_id INTEGER REFERENCES users(id),
 consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)),
 PRIMARY KEY(student_id,advisor_id));
CREATE TABLE IF NOT EXISTS advising_notes (
 id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id),
 advisor_id INTEGER NOT NULL REFERENCES users(id), note TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS course_messages (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
 author_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS course_forms (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
 title TEXT NOT NULL, question TEXT NOT NULL, options_json TEXT NOT NULL,
 open INTEGER NOT NULL DEFAULT 1 CHECK(open IN (0,1)), created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS form_responses (
 form_id INTEGER REFERENCES course_forms(id), student_id INTEGER REFERENCES users(id),
 choice INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(form_id,student_id));
CREATE TABLE IF NOT EXISTS programmes (
 id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, department TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS student_programmes (
 student_id INTEGER PRIMARY KEY REFERENCES users(id), programme_id INTEGER NOT NULL REFERENCES programmes(id));

CREATE TABLE IF NOT EXISTS resources (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id),
 title TEXT NOT NULL, filename TEXT NOT NULL, content BLOB NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notification_reads (
 notification_id INTEGER PRIMARY KEY REFERENCES notifications(id), read_at TEXT NOT NULL);
