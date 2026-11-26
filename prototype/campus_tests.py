"""Campus service and API regression tests."""
import unittest,tempfile,threading,http.client,json
from pathlib import Path
from contextlib import closing
from .app import make_server
from .db import Database
from .identity import User,DomainError
from .courses import CourseService
from .learning import LearningFacade,LearningRepository,SQLiteFileAdapter,EventBus,AuditObserver,NotificationObserver
from .api import CampusAPI
from datetime import datetime,timezone,timedelta

class CampusTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.dbfile=Path(self.tmp.name)/'test.db'
        self.database=Database(self.dbfile);self.database.initialize();self.db=self.database.connect()
        bus=EventBus();bus.subscribe(AuditObserver());bus.subscribe(NotificationObserver())
        self.api=CampusAPI(CourseService(),LearningFacade(CourseService(),LearningRepository(),SQLiteFileAdapter(),bus),bus)
        self.lecturer=User(1,'lecturer','Lecturer','lecturer')
        self.student=User(2,'student','Student','student')
        self.other=User(3,'other','Other','student')
        self.admin=User(4,'admin','Admin','admin')
        self.advisor=User(5,'advisor','Advisor','advisor')
        self.lecturer2=User(6,'lecturer2','Lecturer2','lecturer')
    def tearDown(self):self.db.close();self.tmp.cleanup()
    def cmd(self,user,action,**args):
        with self.db:self.api.command(self.db,user,action,args)
    def state(self,user):return self.api.snapshot(self.db,user,'csrf')
    def test_registration_checks(self):
        self.cmd(self.student,'register',course_id=3)
        for cid in (3,5,6):
            with self.assertRaises(DomainError):self.cmd(self.student,'register',course_id=cid)
        with self.assertRaises(DomainError):self.cmd(self.other,'register',course_id=3)
        with self.assertRaises(DomainError):self.cmd(self.lecturer,'register',course_id=4)
        self.assertIn(3,[x['id'] for x in self.state(self.student)['courses']])
    def test_attendance_roles_and_records(self):
        self.cmd(self.lecturer,'attendance-session',course_id=1,date='2026-11-26',title='Lecture')
        self.cmd(self.lecturer,'attendance-mark',session_id=1,student_id=2,status='present')
        self.assertEqual(self.state(self.student)['attendance']['rate'],100)
        with self.assertRaises(DomainError):self.cmd(self.lecturer2,'attendance-mark',session_id=1,student_id=2,status='absent')
        with self.assertRaises(DomainError):self.cmd(self.lecturer,'attendance-mark',session_id=1,student_id=3,status='present')
        self.assertIsNone(self.state(self.other)['attendance']['rate'])
    def test_records_release_and_gpa(self):
        with self.assertRaises(DomainError):self.cmd(self.lecturer,'release-result',course_id=1,student_id=2)
        self.cmd(self.lecturer,'publish',course_id=1,title='Final',description='Work',due_at='2099-01-01T12:00',max_points=100,policy='strict')
        self.cmd(self.student,'submit',assignment_id=1,file=('work.pdf',b'%PDF-1.4\n%%EOF'))
        self.cmd(self.lecturer,'grade',submission_id=1,score=93,comment='Excellent')
        self.cmd(self.lecturer,'release-result',course_id=1,student_id=2)
        self.assertEqual(self.state(self.student)['record']['gpa'],3.65)
        with self.assertRaises(DomainError):self.cmd(self.lecturer,'publish',course_id=1,title='Extra',description='Work',due_at='2099-01-01T12:00',max_points=100,policy='strict')
    def test_finance_owner_and_no_duplicate_payment(self):
        with self.assertRaises(DomainError):self.cmd(self.other,'pay',invoice_id=1)
        self.cmd(self.student,'pay',invoice_id=1)
        self.assertEqual(self.state(self.student)['finance'][0]['status'],'paid')
        with self.assertRaises(DomainError):self.cmd(self.student,'pay',invoice_id=1)
        self.assertEqual(len(self.state(self.admin)['finance']),3)
    def test_service_request_lifecycle(self):
        self.cmd(self.student,'request',category='transcript',subject='Letter',description='Demo')
        with self.assertRaises(DomainError):self.cmd(self.other,'request-status',request_id=1,status='cancelled')
        with self.assertRaises(DomainError):self.cmd(self.admin,'request-status',request_id=1,status='resolved',note='Done')
        self.cmd(self.admin,'request-status',request_id=1,status='in_review')
        self.cmd(self.admin,'request-status',request_id=1,status='resolved',note='Done')
        self.assertEqual(self.state(self.student)['requests'][0]['status'],'resolved')
        with self.assertRaises(DomainError):self.cmd(self.student,'request-status',request_id=1,status='cancelled')
    def test_advising_revocation(self):
        self.assertNotIn('record',self.state(self.advisor)['advisees'][0])
        with self.assertRaises(DomainError):self.cmd(self.advisor,'advising-note',student_id=2,note='Blocked')
        self.cmd(self.student,'consent',advisor_id=5,enabled=1)
        self.cmd(self.advisor,'advising-note',student_id=2,note='Meet next week')
        self.assertIn('record',self.state(self.advisor)['advisees'][0])
        self.assertEqual(self.state(self.student)['advising']['notes'][0]['note'],'Meet next week')
        self.cmd(self.student,'consent',advisor_id=5,enabled=0)
        self.assertNotIn('record',self.state(self.advisor)['advisees'][0])
    def test_workspace_polls(self):
        self.cmd(self.lecturer,'form',course_id=1,title='Poll',question='Time?',options=['AM','PM'])
        with self.assertRaises(DomainError):self.cmd(self.other,'form-response',form_id=1,choice=0)
        self.cmd(self.student,'form-response',form_id=1,choice=1)
        with self.assertRaises(DomainError):self.cmd(self.student,'form-response',form_id=1,choice=0)
        self.cmd(self.student,'message',course_id=1,body='Hello')
        data=next(c for c in self.state(self.lecturer)['courses'] if c['id']==1)['workspace']
        self.assertEqual(data['forms'][0]['counts'],[0,1]);self.assertEqual(data['messages'][0]['body'],'Hello')
        self.cmd(self.lecturer,'form-close',form_id=1)
    def test_governance_and_privacy(self):
        self.cmd(self.admin,'programme',name='BSc IT',department='Engineering')
        self.cmd(self.admin,'assign-programme',student_id=2,programme_id=2)
        self.assertEqual(self.state(self.student)['record']['programme'][0]['name'],'BSc IT')
        with self.assertRaises(DomainError):self.cmd(self.student,'programme',name='Bad',department='Bad')
        self.assertNotIn('governance',self.state(self.student))
        self.assertNotIn('finance',self.state(self.advisor))
        self.assertNotIn('password_hash',json.dumps(self.state(self.admin)))
    def test_resource_and_notifications(self):
        self.cmd(self.lecturer,'resource',course_id=1,title='Lecture',file=('lecture.pdf',b'%PDF-1.4'))
        self.assertEqual(self.state(self.student)['courses'][0]['resources'][0]['title'],'Lecture')
        with self.assertRaises(DomainError):self.api.resources.download(self.db,self.other,1)
        self.assertEqual(self.api.resources.download(self.db,self.student,1)[1],b'%PDF-1.4')
        nid=self.state(self.student)['notifications'][0]['id']
        with self.assertRaises(DomainError):self.cmd(self.other,'notification-read',notification_id=nid)
        self.cmd(self.student,'notification-read',notification_id=nid)
        self.assertIsNotNone(self.state(self.student)['notifications'][0]['read_at'])
    def test_create_demo_user(self):
        self.cmd(self.admin,'user',username='new_student',name='Demo Person',role='student',password='DemoStudent!2026')
        self.assertIn('new_student',[u['username'] for u in self.state(self.admin)['governance']['people']])
        with self.assertRaises(DomainError):self.cmd(self.student,'user',username='blocked',name='No',role='admin',password='DemoStudent!2026')
    def test_http_json_and_fallback(self):
        srv=make_server(self.dbfile,0);thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start()
        def request(method,path,data=None,cookie='',csrf=''):
            c=http.client.HTTPConnection('127.0.0.1',srv.server_port)
            c.request(method,path,json.dumps(data) if data is not None else None,{'Cookie':cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'})
            r=c.getresponse();result=(r.status,r.read(),r.getheader('Set-Cookie'));c.close();return result
        try:
            self.assertEqual(request('GET','/api/state')[0],401)
            status,_,cookie=request('POST','/api/login',dict(username='student',password='DemoOnly!2026'))
            self.assertEqual(status,200);cookie=cookie.split(';')[0]
            state=json.loads(request('GET','/api/state',cookie=cookie)[1])
            self.assertEqual(state['user']['role'],'student')
            self.assertEqual(request('POST','/api/actions/pay',dict(invoice_id=1),cookie,'bad')[0],403)
            self.assertEqual(request('POST','/api/actions/pay',dict(invoice_id=1),cookie,state['csrf'])[0],200)
            self.assertIn(b'Campus dashboard',request('GET','/campus',cookie=cookie)[1])
            self.assertEqual(json.loads(request('GET','/api/state',cookie=cookie)[1])['finance'][0]['status'],'paid')
        finally:srv.shutdown();srv.server_close();thread.join()
