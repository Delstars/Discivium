"""Run python -m unittest prototype.tests -v. Real SQLite and HTTP integration."""
import unittest, tempfile, threading, http.client, urllib.parse, re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from contextlib import closing
from .app import make_server
from .db import Database
from .identity import User, DomainError
from .courses import CourseService
from .learning import LearningFacade, LearningRepository, SQLiteFileAdapter, EventBus, AuditObserver, NotificationObserver

PDF=b'%PDF-1.4\nfictional test file\n%%EOF'
class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.database=Database(Path(self.tmp.name)/'test.db'); self.database.initialize()
        self.db=self.database.connect()
        bus=EventBus(); bus.subscribe(AuditObserver()); bus.subscribe(NotificationObserver())
        self.learning=LearningFacade(CourseService(),LearningRepository(),SQLiteFileAdapter(),bus)
        self.lecturer=User(1,'lecturer','Lecturer','lecturer')
        self.student=User(2,'student','Student','student')
        self.other=User(3,'other','Other','student')
        self.lecturer2=User(6,'lecturer2','Other lecturer','lecturer')
    def tearDown(self):
        self.db.close(); self.tmp.cleanup()
    def publish(self,policy='allow_late',offset=1):
        return self.learning.publish_assignment(self.db,self.lecturer,1,'Architecture','Submit a file',(datetime.now(timezone.utc)+timedelta(days=offset)).isoformat(),30,policy)
    def test_complete_workflow_persists(self):
        with self.db:
            aid=self.publish()
            sid=self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
            self.assertEqual(self.learning.download(self.db,self.lecturer,sid),('work.pdf',PDF))
            self.learning.grade(self.db,self.lecturer,sid,27,'Good design')
        with closing(self.database.connect()) as another:
            self.assertEqual(self.learning.submissions(another,self.student,aid)[0]['score'],27)
            self.assertEqual(self.learning.download(another,self.student,sid)[1],PDF)
            self.assertEqual(another.execute('SELECT COUNT(*) FROM audit').fetchone()[0],3)
            self.assertEqual(another.execute('SELECT COUNT(*) FROM notifications').fetchone()[0],3)
    def test_permissions(self):
        aid=self.publish()
        with self.assertRaises(DomainError): self.learning.submit(self.db,self.other,aid,'work.pdf',PDF)
        sid=self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
        for actor in (self.student,self.lecturer2,self.other):
            with self.assertRaises(DomainError): self.learning.grade(self.db,actor,sid,10,'No')
        with self.assertRaises(DomainError): self.learning.download(self.db,self.other,sid)
        with self.assertRaises(DomainError): self.learning.publish_assignment(self.db,self.student,1,'x','y',datetime.now(timezone.utc).isoformat(),30,'strict')
    def test_validation_and_state(self):
        aid=self.publish()
        with self.assertRaises(DomainError): self.learning.submit(self.db,self.student,aid,'bad.pdf',b'bad')
        sid=self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
        with self.assertRaises(DomainError): self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
        with self.assertRaises(DomainError): self.learning.grade(self.db,self.lecturer,sid,31,'No')
        self.learning.grade(self.db,self.lecturer,sid,30,'Yes')
        with self.assertRaises(DomainError): self.learning.grade(self.db,self.lecturer,sid,29,'No')
    def test_strategy(self):
        with self.assertRaises(DomainError): self.learning.submit(self.db,self.student,self.publish('strict',-1),'work.pdf',PDF)
        aid=self.publish('allow_late',-1); self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
        self.assertEqual(self.learning.submissions(self.db,self.student,aid)[0]['late'],1)
    def test_observer_failure_rolls_back(self):
        aid=self.publish(); self.db.commit()
        class Broken:
            def update(self,db,event): raise RuntimeError('observer unavailable')
        self.learning.events.subscribe(Broken())
        with self.assertRaises(RuntimeError):
            with self.db: self.learning.submit(self.db,self.student,aid,'work.pdf',PDF)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM submissions').fetchone()[0],0)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM submission_files').fetchone()[0],0)
class HTTPTests(unittest.TestCase):
    def test_browser_workflow(self):
        with tempfile.TemporaryDirectory() as tmp:
            server=make_server(Path(tmp)/'http.db',0)
            thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
            def request(method,path,data=None,cookie='',ctype='application/x-www-form-urlencoded'):
                conn=http.client.HTTPConnection('127.0.0.1',server.server_port)
                conn.request(method,path,data,{'Cookie':cookie,'Content-Type':ctype})
                r=conn.getresponse(); result=(r.status,r.read(),r.getheader('Set-Cookie')); conn.close(); return result
            def login(name):
                status,_,cookie=request('POST','/login',urllib.parse.urlencode(dict(username=name,password='DemoOnly!2026')))
                self.assertEqual(status,303)
                cookie=cookie.split(';')[0]
                body=request('GET','/',cookie=cookie)[1].decode()
                return cookie,re.search(r'name="csrf" value="([^"]+)"',body).group(1)
            try:
                lec,lcsrf=login('lecturer')
                data=dict(csrf=lcsrf,course_id=1,title='HTTP assignment',description='A document',due_at='2099-01-01T12:00',max_points=30,policy='strict')
                self.assertEqual(request('POST','/publish',urllib.parse.urlencode(data),lec)[0],303)
                self.assertEqual(request('POST','/publish',urllib.parse.urlencode({**data,'csrf':'bad'}),lec)[0],403)
                stu,scsrf=login('student')
                self.assertIn(b'HTTP assignment',request('GET','/',cookie=stu)[1])
                boundary='testboundary'
                multipart=(f'--{boundary}\r\nContent-Disposition: form-data; name="csrf"\r\n\r\n{scsrf}\r\n--{boundary}\r\nContent-Disposition: form-data; name="assignment_id"\r\n\r\n1\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n').encode()+PDF+f'\r\n--{boundary}--\r\n'.encode()
                self.assertEqual(request('POST','/submit',multipart,stu,'multipart/form-data; boundary='+boundary)[0],303)
                self.assertEqual(request('GET','/download?id=1',cookie=lec)[1],PDF)
                self.assertEqual(request('POST','/grade',urllib.parse.urlencode(dict(csrf=lcsrf,submission_id=1,score=28,comment='Great')),lec)[0],303)
                self.assertIn(b'Feedback: 28/30',request('GET','/',cookie=stu)[1])
                other,_=login('other')
                self.assertEqual(request('GET','/download?id=1',cookie=other)[0],403)
            finally:
                server.shutdown(); server.server_close(); thread.join()
if __name__=='__main__': unittest.main()
