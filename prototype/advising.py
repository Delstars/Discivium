"""AdvisingService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class AdvisingService:
    def __init__(self,records,attendance,bus):self.records,self.attendance,self.bus=records,attendance,bus
    def consent(self,db,user,advisor,enabled):
        role(user,'student')
        one(db,"SELECT * FROM advisor_assignments WHERE student_id=? AND advisor_id=?",(user.id,advisor))
        if enabled not in (0,1):raise DomainError('Invalid consent')
        db.execute("UPDATE advisor_assignments SET consent=? WHERE student_id=? AND advisor_id=?",(enabled,user.id,advisor))
        event(self.bus,db,user,'consent_changed',advisor,[advisor],'Student changed advising consent')
    def require(self,db,user,sid):
        role(user,'advisor')
        if not db.execute("SELECT 1 FROM advisor_assignments WHERE advisor_id=? AND student_id=? AND consent=1",(user.id,sid)).fetchone():
            raise DomainError('Assigned advisor and active consent required',403)
    def note(self,db,user,sid,note):
        self.require(db,user,sid)
        nid=db.execute("INSERT INTO advising_notes(student_id,advisor_id,note,created_at) VALUES (?,?,?,?)",(sid,user.id,text(note,2000),now())).lastrowid
        event(self.bus,db,user,'advising_note',nid,[sid],'New advising note available')
    def students(self,db,user):
        role(user,'advisor')
        items=rows(db,"SELECT u.id,u.name,a.consent FROM advisor_assignments a JOIN users u ON u.id=a.student_id WHERE a.advisor_id=?",(user.id,))
        for item in items:
            if not item['consent']:continue
            sid=item['id']; item['record']=self.records.record(db,sid);item['attendance']=self.attendance.student_record(db,sid)
            item['notes']=rows(db,"SELECT * FROM advising_notes WHERE student_id=? AND advisor_id=? ORDER BY id DESC",(sid,user.id))
            rate=item['attendance']['rate']; gpa=item['record']['gpa']
            item['risk_reasons']=[label for condition,label in [(rate is not None and rate<80,'Attendance below 80%'),(gpa is not None and gpa<2,'GPA below 2.0')] if condition]
        return items
    def student_view(self,db,user):
        role(user,'student')
        return dict(advisors=rows(db,"SELECT u.id,u.name,a.consent FROM advisor_assignments a JOIN users u ON u.id=a.advisor_id WHERE a.student_id=?",(user.id,)),
          notes=rows(db,"SELECT n.*,u.name AS advisor_name FROM advising_notes n JOIN users u ON u.id=n.advisor_id WHERE n.student_id=? ORDER BY n.id DESC",(user.id,)))

