"""GovernanceService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class GovernanceService:
    def __init__(self,bus):self.bus=bus
    def overview(self,db,user):
        role(user,'admin')
        return dict(people=rows(db,"SELECT id,username,name,role FROM users ORDER BY role,name"),
          programmes=rows(db,"SELECT * FROM programmes"),courses=rows(db,"SELECT c.*,o.* FROM courses c LEFT JOIN offerings o ON o.course_id=c.id ORDER BY c.code"),
          enrollments=rows(db,"SELECT * FROM enrollments"),advisor_assignments=rows(db,"SELECT * FROM advisor_assignments"),
          audit=rows(db,"SELECT a.*,u.name AS actor_name FROM audit a JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200"))
    def programme(self,db,user,name,department):
        role(user,'admin'); name=text(name,150)
        if db.execute("SELECT 1 FROM programmes WHERE name=?",(name,)).fetchone():raise DomainError('Programme already exists',409)
        pid=db.execute("INSERT INTO programmes(name,department) VALUES (?,?)",(name,text(department,150))).lastrowid
        event(self.bus,db,user,'programme_created',pid,[],'Programme created')
    def assign_advisor(self,db,user,sid,aid):
        role(user,'admin');one(db,"SELECT id FROM users WHERE id=? AND role='student'",(sid,));one(db,"SELECT id FROM users WHERE id=? AND role='advisor'",(aid,))
        if db.execute("SELECT 1 FROM advisor_assignments WHERE student_id=? AND advisor_id=?",(sid,aid)).fetchone():raise DomainError('Advisor already assigned',409)
        db.execute("INSERT INTO advisor_assignments VALUES (?,?,0)",(sid,aid));event(self.bus,db,user,'advisor_assigned',aid,[sid],'Advisor assigned; consent required')
    def create_course(self,db,user,code,title,lecturer,credits,capacity,day,start,end,room):
        role(user,'admin');one(db,"SELECT id FROM users WHERE id=? AND role='lecturer'",(lecturer,))
        code=text(code,20).upper()
        if db.execute("SELECT 1 FROM courses WHERE code=?",(code,)).fetchone():raise DomainError('Course already exists',409)
        if not 0<=day<=6 or not 0<=start<end<=1440 or not 1<=credits<=6 or not 1<=capacity<=1000:raise DomainError('Invalid offering')
        if db.execute("""SELECT 1 FROM offerings o JOIN courses c ON c.id=o.course_id
           WHERE o.semester='Fall 2026' AND o.weekday=? AND o.start_min<? AND o.end_min>? AND (c.lecturer_id=? OR o.room=?)""",(day,end,start,lecturer,room)).fetchone():
            raise DomainError('Lecturer or room timetable conflict',409)
        cid=db.execute("INSERT INTO courses(code,title,lecturer_id) VALUES (?,?,?)",(code,text(title,150),lecturer)).lastrowid
        db.execute("INSERT INTO offerings VALUES (?,?,?,?,?,?,?,'Fall 2026')",(cid,credits,capacity,day,start,end,text(room,30)))
        event(self.bus,db,user,'course_created',cid,[lecturer],'New course offering')
    def assign_programme(self,db,user,sid,pid):
        role(user,'admin')
        one(db,"SELECT id FROM users WHERE id=? AND role='student'",(sid,))
        one(db,"SELECT id FROM programmes WHERE id=?",(pid,))
        db.execute("INSERT INTO student_programmes VALUES (?,?) ON CONFLICT(student_id) DO UPDATE SET programme_id=excluded.programme_id",(sid,pid))
        event(self.bus,db,user,'programme_assigned',pid,[sid],'Academic programme assigned')
    def create_user(self,db,user,username,name,role_name,password):
        from .identity import password_record
        role(user,'admin')
        username=text(username,50).lower()
        if not username.isascii() or not username.replace('_','').replace('-','').isalnum():
            raise DomainError('Use letters, numbers, hyphens or underscores for username')
        if role_name not in ('student','lecturer','advisor','admin'):raise DomainError('Invalid role')
        if not isinstance(password,str) or not 10<=len(password)<=128:raise DomainError('Demo password must contain 10–128 characters')
        if db.execute("SELECT 1 FROM users WHERE username=?",(username,)).fetchone():raise DomainError('Username already exists',409)
        salt,digest=password_record(password)
        uid=db.execute("INSERT INTO users(username,name,role,salt,password_hash) VALUES (?,?,?,?,?)",(username,text(name,120),role_name,salt,digest)).lastrowid
        event(self.bus,db,user,'user_created',uid,[],'Demo account created')
