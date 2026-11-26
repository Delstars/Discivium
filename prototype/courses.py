"""Courses owns teaching responsibility and enrollment relationships."""
from .identity import DomainError
class CourseService:
    def get(self, db, course_id):
        row = db.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
        if not row: raise DomainError('Course not found',404)
        return row
    def require_lecturer(self, db, user, course_id):
        course = self.get(db,course_id)
        if user.role != 'lecturer' or course['lecturer_id'] != user.id:
            raise DomainError('Only the assigned lecturer may perform this action',403)
        return course
    def require_student(self, db, user, course_id):
        if user.role != 'student' or not db.execute(
            "SELECT 1 FROM enrollments WHERE course_id=? AND student_id=?",
            (course_id,user.id)).fetchone():
            raise DomainError('Active course enrollment required',403)
    def visible(self, db, user):
        if user.role == 'lecturer':
            return db.execute("SELECT * FROM courses WHERE lecturer_id=?", (user.id,)).fetchall()
        if user.role == 'student':
            return db.execute("SELECT c.* FROM courses c JOIN enrollments e ON c.id=e.course_id WHERE e.student_id=?", (user.id,)).fetchall()
        return []
    def enroll(self, db, user, course_id, student_id):
        if user.role != 'admin': raise DomainError('Administrator required',403)
        self.get(db,course_id)
        if not db.execute("SELECT 1 FROM users WHERE id=? AND role='student'",(student_id,)).fetchone():
            raise DomainError('Student not found',404)
        db.execute("INSERT OR IGNORE INTO enrollments VALUES (?,?)",(course_id,student_id))
