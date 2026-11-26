"""StudentServices module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class StudentServices:
    transitions={'pending':{'in_review','rejected','cancelled'},'in_review':{'resolved','rejected','cancelled'}}
    def __init__(self,bus):self.bus=bus
    def create(self,db,user,category,subject,description):
        role(user,'student')
        if category not in ('transcript','enrollment_letter','it_support','general'):raise DomainError('Unknown request category')
        rid=db.execute("INSERT INTO service_requests(student_id,category,subject,description,status,created_at,updated_at) VALUES (?,?,?,?,'pending',?,?)",
                       (user.id,category,text(subject,150),text(description,3000),now(),now())).lastrowid
        event(self.bus,db,user,'request_created',rid,[r['id'] for r in rows(db,"SELECT id FROM users WHERE role='admin'")],'New campus service request')
        return rid
    def change(self,db,user,rid,status,note=''):
        r=one(db,"SELECT * FROM service_requests WHERE id=?",(rid,))
        if user.role=='student':
            if r['student_id']!=user.id or status!='cancelled':raise DomainError('Permission denied',403)
        else:
            role(user,'admin')
            if status=='cancelled':raise DomainError('Only owner can cancel',403)
        if status not in self.transitions.get(r['status'],set()):raise DomainError('Illegal request transition',409)
        if status in ('resolved','rejected'): note=text(note,1000)
        db.execute("UPDATE service_requests SET status=?,decision=?,updated_at=? WHERE id=?",(status,note,now(),rid))
        event(self.bus,db,user,'request_'+status,rid,[r['student_id']],'Service request: '+status)
    def list(self,db,user):
        role(user,'student','admin')
        return rows(db,"SELECT r.*,u.name AS student_name FROM service_requests r JOIN users u ON u.id=r.student_id"+(" WHERE r.student_id=?" if user.role=='student' else "")+" ORDER BY r.id DESC",(user.id,) if user.role=='student' else ())

