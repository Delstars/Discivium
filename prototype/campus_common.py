"""Campus feature services. All writes run in the caller's single transaction."""
import json
from datetime import date
from .identity import DomainError
from .db import now

def rows(db, sql, args=()):
    return [dict(r) for r in db.execute(sql,args)]
def one(db, sql, args=()):
    r=db.execute(sql,args).fetchone()
    if not r: raise DomainError('Record not found',404)
    return dict(r)
def role(user,*roles):
    if user.role not in roles: raise DomainError('Permission denied',403)
def text(value,limit=1000):
    if not isinstance(value,str) or not value.strip() or len(value.strip())>limit:
        raise DomainError('Invalid text field')
    return value.strip()
def integer(value,minimum=1,maximum=100000000):
    if isinstance(value,bool) or not isinstance(value,(int,str)) or isinstance(value,str) and not value.isdecimal():
        raise DomainError('Invalid integer')
    n=int(value)
    if not minimum<=n<=maximum: raise DomainError('Integer outside allowed range')
    return n
def event(bus,db,user,action,entity,recipients,message):
    bus.publish(db,dict(actor=user.id,action=action,entity=entity,recipients=recipients,message=message))
def require_member(courses,db,user,cid):
    if user.role=='student': courses.require_student(db,user,cid)
    else: courses.require_lecturer(db,user,cid)

