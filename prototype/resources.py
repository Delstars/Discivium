"""Course resource repository and access rules."""
from .campus_common import rows,one,text,require_member,event
from .identity import DomainError
from .db import now
from .learning import validate_file
class ResourceService:
    def __init__(self,courses,bus):self.courses,self.bus=courses,bus
    def create(self,db,user,cid,title,filename,content):
        self.courses.require_lecturer(db,user,cid)
        validate_file(filename,content)
        rid=db.execute("INSERT INTO resources(course_id,title,filename,content,created_at) VALUES (?,?,?,?,?)",(cid,text(title,150),filename,content,now())).lastrowid
        recipients=[r['student_id'] for r in rows(db,"SELECT student_id FROM enrollments WHERE course_id=?",(cid,))]
        event(self.bus,db,user,'resource_published',rid,recipients,'New course resource: '+title)
    def list(self,db,user,cid):
        require_member(self.courses,db,user,cid)
        return rows(db,"SELECT id,course_id,title,filename,created_at FROM resources WHERE course_id=? ORDER BY id DESC",(cid,))
    def download(self,db,user,rid):
        record=one(db,"SELECT * FROM resources WHERE id=?",(rid,))
        require_member(self.courses,db,user,record['course_id'])
        return record['filename'],record['content']
