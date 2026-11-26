"""AttendanceService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class AttendanceService:
    def __init__(self,courses,bus):self.courses,self.bus=courses,bus
    def create(self,db,user,cid,day,title):
        self.courses.require_lecturer(db,user,cid)
        try: date.fromisoformat(day)
        except (ValueError,TypeError): raise DomainError('Invalid date')
        title=text(title,120)
        if db.execute("SELECT 1 FROM attendance_sessions WHERE course_id=? AND session_date=? AND title=?",(cid,day,title)).fetchone():
            raise DomainError('Session already exists',409)
        session=db.execute("INSERT INTO attendance_sessions(course_id,session_date,title) VALUES (?,?,?)",(cid,day,title)).lastrowid
        event(self.bus,db,user,'attendance_session_created',session,[],'Attendance session created')
        return session
    def mark(self,db,user,session,sid,status):
        s=one(db,"SELECT * FROM attendance_sessions WHERE id=?",(session,))
        self.courses.require_lecturer(db,user,s['course_id'])
        if status not in ('present','absent','late','excused'):raise DomainError('Invalid attendance status')
        if not db.execute("SELECT 1 FROM enrollments WHERE course_id=? AND student_id=?",(s['course_id'],sid)).fetchone():
            raise DomainError('Student not enrolled',403)
        db.execute("INSERT INTO attendance VALUES (?,?,?) ON CONFLICT(session_id,student_id) DO UPDATE SET status=excluded.status",(session,sid,status))
        event(self.bus,db,user,'attendance_marked',session,[],'Attendance recorded')
    def student_record(self,db,sid):
        items=rows(db,"""SELECT c.code,s.id AS session_id,s.session_date,s.title,a.status
             FROM attendance a JOIN attendance_sessions s ON s.id=a.session_id JOIN courses c ON c.id=s.course_id
             WHERE a.student_id=? ORDER BY s.session_date DESC""",(sid,))
        count=sum(r['status']!='excused' for r in items)
        return dict(items=items,rate=round(100*sum(r['status'] in ('present','late') for r in items)/count,1) if count else None)
    def roster(self,db,user,cid):
        self.courses.require_lecturer(db,user,cid)
        return rows(db,"SELECT u.id,u.name FROM users u JOIN enrollments e ON u.id=e.student_id WHERE e.course_id=? ORDER BY u.name",(cid,))
    def sessions(self,db,user,cid):
        self.courses.require_lecturer(db,user,cid)
        sessions=rows(db,"SELECT * FROM attendance_sessions WHERE course_id=? ORDER BY session_date DESC",(cid,))
        for s in sessions:s['marks']=rows(db,"SELECT * FROM attendance WHERE session_id=?",(s['id'],))
        return sessions

