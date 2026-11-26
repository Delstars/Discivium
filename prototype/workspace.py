"""WorkspaceService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class WorkspaceService:
    """Internal course messaging and one-response polls, no external integrations."""
    def __init__(self,courses,bus):self.courses,self.bus=courses,bus
    def message(self,db,user,cid,body):
        require_member(self.courses,db,user,cid)
        mid=db.execute("INSERT INTO course_messages(course_id,author_id,body,created_at) VALUES (?,?,?,?)",(cid,user.id,text(body,2000),now())).lastrowid
        event(self.bus,db,user,'course_message',mid,[],'Course message posted')
    def form(self,db,user,cid,title,question,options):
        self.courses.require_lecturer(db,user,cid)
        if isinstance(options,str):options=[s.strip() for s in options.split('|')]
        if not isinstance(options,list) or not 2<=len(options)<=8:raise DomainError('Provide 2–8 options')
        options=[text(s,100) for s in options]
        if len(set(options))!=len(options):raise DomainError('Options must be distinct')
        fid=db.execute("INSERT INTO course_forms(course_id,title,question,options_json,created_at) VALUES (?,?,?,?,?)",
                       (cid,text(title,150),text(question,500),json.dumps(options),now())).lastrowid
        event(self.bus,db,user,'form_created',fid,[],'Course poll created')
        return fid
    def respond(self,db,user,fid,choice):
        f=one(db,"SELECT * FROM course_forms WHERE id=?",(fid,));self.courses.require_student(db,user,f['course_id'])
        if not f['open']:raise DomainError('Poll closed',409)
        if not 0<=choice<len(json.loads(f['options_json'])):raise DomainError('Invalid option')
        if db.execute("SELECT 1 FROM form_responses WHERE form_id=? AND student_id=?",(fid,user.id)).fetchone():raise DomainError('Already responded',409)
        db.execute("INSERT INTO form_responses VALUES (?,?,?,?)",(fid,user.id,choice,now()))
        event(self.bus,db,user,'form_response',fid,[],'Poll response recorded')
    def close(self,db,user,fid):
        f=one(db,"SELECT * FROM course_forms WHERE id=?",(fid,));self.courses.require_lecturer(db,user,f['course_id'])
        if not f['open']:raise DomainError('Poll already closed',409)
        db.execute("UPDATE course_forms SET open=0 WHERE id=?",(fid,))
        event(self.bus,db,user,'form_closed',fid,[],'Poll closed')
    def read(self,db,user,cid):
        require_member(self.courses,db,user,cid)
        messages=rows(db,"SELECT m.*,u.name AS author_name FROM course_messages m JOIN users u ON u.id=m.author_id WHERE m.course_id=? ORDER BY m.id DESC LIMIT 100",(cid,))
        forms=rows(db,"SELECT * FROM course_forms WHERE course_id=? ORDER BY id DESC",(cid,))
        for f in forms:
            f['options']=json.loads(f.pop('options_json'))
            if user.role=='lecturer':
                f['counts']=[db.execute("SELECT COUNT(*) FROM form_responses WHERE form_id=? AND choice=?",(f['id'],i)).fetchone()[0] for i in range(len(f['options']))]
            else:
                r=db.execute("SELECT choice FROM form_responses WHERE form_id=? AND student_id=?",(f['id'],user.id)).fetchone()
                f['my_choice']=r['choice'] if r else None
        return dict(messages=messages,forms=forms)

