"""RegistrationService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class RegistrationService:
    """Eligibility constraints and serialized seat allocation."""
    def __init__(self,courses,bus): self.courses,self.bus=courses,bus
    def catalogue(self,db,user):
        role(user,'student','admin')
        return rows(db,"""SELECT c.id,c.code,c.title,u.name AS lecturer,o.*,
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) AS occupied
           FROM courses c JOIN offerings o ON o.course_id=c.id JOIN users u ON u.id=c.lecturer_id
           WHERE o.semester='Fall 2026' ORDER BY c.code""")
    def register(self,db,user,cid):
        role(user,'student')
        return self.allocate(db,user,user.id,cid)
    def admin_enroll(self,db,user,cid,sid):
        role(user,'admin')
        one(db,"SELECT id FROM users WHERE id=? AND role='student'",(sid,))
        return self.allocate(db,user,sid,cid)
    def allocate(self,db,user,sid,cid):
        o=one(db,"SELECT * FROM offerings WHERE course_id=? AND semester='Fall 2026'",(cid,))
        if db.execute("SELECT 1 FROM course_results WHERE course_id=?",(cid,)).fetchone():
            raise DomainError('Registration closed for this course',409)
        if db.execute("SELECT 1 FROM enrollments WHERE course_id=? AND student_id=?",(cid,sid)).fetchone():
            raise DomainError('Already enrolled',409)
        if db.execute("SELECT 1 FROM course_results WHERE course_id=? AND student_id=? AND percentage>=60",(cid,sid)).fetchone():
            raise DomainError('Course already passed',409)
        if db.execute("SELECT COUNT(*) FROM enrollments WHERE course_id=?",(cid,)).fetchone()[0]>=o['capacity']:
            raise DomainError('No available seats',409)
        missing=db.execute("""SELECT 1 FROM prerequisites p WHERE p.course_id=? AND NOT EXISTS
            (SELECT 1 FROM course_results r WHERE r.course_id=p.required_course_id AND r.student_id=? AND r.percentage>=60)""",(cid,sid)).fetchone()
        if missing: raise DomainError('Prerequisite not completed',409)
        clash=db.execute("""SELECT 1 FROM enrollments e JOIN offerings x ON x.course_id=e.course_id
            WHERE e.student_id=? AND x.semester=? AND x.weekday=? AND x.start_min<? AND x.end_min>?""",
            (sid,o['semester'],o['weekday'],o['end_min'],o['start_min'])).fetchone()
        if clash: raise DomainError('Timetable conflict',409)
        credits=db.execute("""SELECT COALESCE(SUM(o.credits),0) FROM enrollments e JOIN offerings o ON o.course_id=e.course_id
            WHERE e.student_id=? AND o.semester=?""",(sid,o['semester'])).fetchone()[0]
        if credits+o['credits']>18: raise DomainError('18-credit limit exceeded',409)
        db.execute("INSERT INTO enrollments VALUES (?,?)",(cid,sid))
        event(self.bus,db,user,'registered',cid,[sid],'Course registration confirmed')
    def timetable(self,db,user):
        role(user,'student','lecturer')
        where="e.student_id=?" if user.role=='student' else "c.lecturer_id=?"
        join="JOIN enrollments e ON e.course_id=c.id" if user.role=='student' else ""
        return rows(db,f"""SELECT c.id,c.code,c.title,o.weekday,o.start_min,o.end_min,o.room,o.credits,o.semester
            FROM courses c JOIN offerings o ON o.course_id=c.id {join} WHERE {where} ORDER BY o.weekday,o.start_min""",(user.id,))

