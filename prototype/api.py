"""Browser-independent application API. One role-filtered snapshot, explicit commands."""
from dataclasses import asdict
from datetime import datetime, timezone, timedelta
from .identity import DomainError
from .campus import (rows,integer,RegistrationService,AcademicRecordsService,AttendanceService,FinanceService,
                     StudentServices,AdvisingService,WorkspaceService,GovernanceService,event,one)

from .resources import ResourceService
from .db import now

class CampusAPI:
    def __init__(self,courses,learning,bus):
        self.courses,self.learning,self.bus=courses,learning,bus
        self.registration=RegistrationService(courses,bus)
        self.records=AcademicRecordsService(courses,bus)
        self.attendance=AttendanceService(courses,bus)
        self.finance=FinanceService(bus)
        self.services=StudentServices(bus)
        self.advising=AdvisingService(self.records,self.attendance,bus)
        self.workspace=WorkspaceService(courses,bus)
        self.governance=GovernanceService(bus)
        self.resources=ResourceService(courses,bus)
    def snapshot(self,db,user,csrf):
        state=dict(user=asdict(user),csrf=csrf,semester='Fall 2026',demo=True,
             notifications=rows(db,"SELECT n.id,n.message,n.created_at,r.read_at FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id WHERE n.user_id=? ORDER BY n.id DESC LIMIT 50",(user.id,)))
        if user.role in ('student','lecturer'):
            state['courses']=[]
            for course in self.courses.visible(db,user):
                item=dict(course); cid=item['id']
                item['assignments']=[]
                for assignment in self.learning.assignments(db,user,cid):
                    a=dict(assignment);a['submissions']=[dict(s) for s in self.learning.submissions(db,user,a['id'])]
                    item['assignments'].append(a)
                item['workspace']=self.workspace.read(db,user,cid)
                item['resources']=self.resources.list(db,user,cid)
                if user.role=='lecturer':
                    item['roster']=self.attendance.roster(db,user,cid)
                    item['attendance_sessions']=self.attendance.sessions(db,user,cid)
                    item['released_results']=rows(db,"SELECT student_id,percentage,released_at FROM course_results WHERE course_id=?",(cid,))
                state['courses'].append(item)
            state['timetable']=self.registration.timetable(db,user)
        if user.role=='student':
            state['catalogue']=self.registration.catalogue(db,user)
            for c in state['catalogue']:
                c['prerequisites']=rows(db,"SELECT c.id,c.code,c.title FROM prerequisites p JOIN courses c ON c.id=p.required_course_id WHERE p.course_id=?",(c['id'],))
                c['enrolled']=any(item['id']==c['id'] for item in state['courses'])
            state['record']=self.records.record(db,user.id)
            state['attendance']=self.attendance.student_record(db,user.id)
            state['finance']=self.finance.ledger(db,user)
            state['requests']=self.services.list(db,user)
            state['advising']=self.advising.student_view(db,user)
        elif user.role=='admin':
            state['governance']=self.governance.overview(db,user)
            state['finance']=self.finance.ledger(db,user)
            state['requests']=self.services.list(db,user)
        elif user.role=='advisor':
            state['advisees']=self.advising.students(db,user)
        return state
    def command(self,db,user,name,f):
        def n(k,minimum=1,maximum=100000000):return integer(f[k],minimum,maximum)
        def s(k):return f[k]
        # Route identifiers are explicit; never dispatch arbitrary user-provided method names.
        if name=='publish':
            due=s('due_at')
            if isinstance(due,str) and len(due)==16:due+='+04:00'
            self.learning.publish_assignment(db,user,n('course_id'),s('title'),s('description'),due,n('max_points',1,1000),s('policy'))
        elif name=='submit':
            filename,content=f['file'];self.learning.submit(db,user,n('assignment_id'),filename,content)
        elif name=='grade':self.learning.grade(db,user,n('submission_id'),n('score',0,1000),s('comment'))
        elif name=='enroll':
            cid,sid=n('course_id'),n('student_id')
            self.registration.admin_enroll(db,user,cid,sid)
        elif name=='register':self.registration.register(db,user,n('course_id'))
        elif name=='release-result':self.records.release(db,user,n('course_id'),n('student_id'))
        elif name=='attendance-session':self.attendance.create(db,user,n('course_id'),s('date'),s('title'))
        elif name=='attendance-mark':self.attendance.mark(db,user,n('session_id'),n('student_id'),s('status'))
        elif name=='pay':self.finance.pay(db,user,n('invoice_id'))
        elif name=='invoice':self.finance.issue(db,user,n('student_id'),s('title'),n('amount_fils'),s('due_date'))
        elif name=='request':self.services.create(db,user,s('category'),s('subject'),s('description'))
        elif name=='request-status':self.services.change(db,user,n('request_id'),s('status'),f.get('note',''))
        elif name=='consent':self.advising.consent(db,user,n('advisor_id'),n('enabled',0,1))
        elif name=='advising-note':self.advising.note(db,user,n('student_id'),s('note'))
        elif name=='message':self.workspace.message(db,user,n('course_id'),s('body'))
        elif name=='form':self.workspace.form(db,user,n('course_id'),s('title'),s('question'),s('options'))
        elif name=='form-response':self.workspace.respond(db,user,n('form_id'),n('choice',0,7))
        elif name=='form-close':self.workspace.close(db,user,n('form_id'))
        elif name=='programme':self.governance.programme(db,user,s('name'),s('department'))
        elif name=='assign-advisor':self.governance.assign_advisor(db,user,n('student_id'),n('advisor_id'))
        elif name=='assign-programme':self.governance.assign_programme(db,user,n('student_id'),n('programme_id'))
        elif name=='resource':
            filename,content=f['file'];self.resources.create(db,user,n('course_id'),s('title'),filename,content)
        elif name=='notification-read':
            nid=n('notification_id')
            if not db.execute("SELECT 1 FROM notifications WHERE id=? AND user_id=?",(nid,user.id)).fetchone():raise DomainError('Notification not owned by user',403)
            db.execute("INSERT OR IGNORE INTO notification_reads VALUES (?,?)",(nid,now()))
        elif name=='user':self.governance.create_user(db,user,s('username'),s('name'),s('role'),s('password'))
        elif name=='course':self.governance.create_course(db,user,s('code'),s('title'),n('lecturer_id'),n('credits',1,6),n('capacity',1,1000),n('weekday',0,6),n('start_min',0,1439),n('end_min',1,1440),s('room'))
        else:raise DomainError('Unknown action',404)
