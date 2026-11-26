"""Learning: Facade, Strategy, Adapter and Observer in the actual coursework path."""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from io import BytesIO
import zipfile
from .db import now
from .identity import DomainError

MAX_FILE = 100 * 1024 * 1024

class DeadlinePolicy(ABC):
    @abstractmethod
    def evaluate(self, due, at): ...
class StrictDeadlinePolicy(DeadlinePolicy):
    def evaluate(self, due, at):
        if at > due: raise DomainError('Deadline has passed',409)
        return False
class AllowLatePolicy(DeadlinePolicy):
    def evaluate(self, due, at): return at > due

class FileStorage(ABC):
    @abstractmethod
    def save(self, db, submission_id, content): ...
    @abstractmethod
    def load(self, db, submission_id): ...
class SQLiteFileAdapter(FileStorage):
    """Adapts SQLite BLOB operations to the application's file-storage interface."""
    def save(self, db, submission_id, content):
        db.execute("INSERT INTO submission_files VALUES (?,?)",(submission_id,content))
    def load(self, db, submission_id):
        return db.execute("SELECT content FROM submission_files WHERE submission_id=?",(submission_id,)).fetchone()['content']

class EventBus:
    def __init__(self): self.observers = []
    def subscribe(self, observer): self.observers.append(observer)
    def publish(self, db, event):
        for observer in self.observers: observer.update(db,event)
class AuditObserver:
    def update(self, db, event):
        db.execute("INSERT INTO audit(actor_id,action,entity_id,created_at) VALUES (?,?,?,?)",
                   (event['actor'],event['action'],event['entity'],now()))
class NotificationObserver:
    def update(self, db, event):
        for recipient in event['recipients']:
            db.execute("INSERT INTO notifications(user_id,message,created_at) VALUES (?,?,?)",
                       (recipient,event['message'],now()))

def validate_file(filename, content):
    if not filename or len(filename)>200 or any(c in filename for c in '/\\\r\n') or not content or len(content)>MAX_FILE:
        raise DomainError('Invalid filename or file size (maximum 100 MB)')
    if filename.lower().endswith('.pdf') and content.startswith(b'%PDF-'):
        return
    if filename.lower().endswith('.docx'):
        try:
            with zipfile.ZipFile(BytesIO(content)) as z:
                if {'[Content_Types].xml','word/document.xml'} <= set(z.namelist()): return
        except (zipfile.BadZipFile, OSError, ValueError): pass
    raise DomainError('Only PDF and DOCX documents are accepted')

class LearningRepository:
    def assignment(self, db, aid):
        row=db.execute("SELECT * FROM assignments WHERE id=?",(aid,)).fetchone()
        if not row: raise DomainError('Assignment not found',404)
        return row
    def submission(self, db, sid):
        row=db.execute("SELECT s.*,a.course_id,a.max_points FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=?",(sid,)).fetchone()
        if not row: raise DomainError('Submission not found',404)
        return row
    def create_submission(self, db, aid, user_id, filename, stamp, late):
        return db.execute("INSERT INTO submissions(assignment_id,student_id,filename,submitted_at,late,status) VALUES (?,?,?,?,?,'submitted')",
                          (aid,user_id,filename,stamp,int(late))).lastrowid

    def create_assignment(self,db,course_id,title,description,due,max_points,policy):
        return db.execute("INSERT INTO assignments(course_id,title,description,due_at,max_points,policy) VALUES (?,?,?,?,?,?)",
                          (course_id,title,description,due,max_points,policy)).lastrowid
    def course_closed(self,db,course_id):
        return db.execute("SELECT 1 FROM course_results WHERE course_id=?",(course_id,)).fetchone() is not None
    def recipients(self,db,course_id):
        return [r['student_id'] for r in db.execute("SELECT student_id FROM enrollments WHERE course_id=?",(course_id,))]
    def exists(self,db,assignment_id,student_id):
        return db.execute("SELECT 1 FROM submissions WHERE assignment_id=? AND student_id=?",(assignment_id,student_id)).fetchone() is not None
    def save_feedback(self,db,submission_id,lecturer_id,score,comment):
        db.execute("INSERT INTO feedback VALUES (?,?,?,?,?)",(submission_id,lecturer_id,score,comment,now()))
        db.execute("UPDATE submissions SET status='graded' WHERE id=?",(submission_id,))
    def assignments(self,db,course_id):
        return db.execute("SELECT * FROM assignments WHERE course_id=? ORDER BY id DESC",(course_id,)).fetchall()
    def submissions(self,db,assignment_id,student_id=None):
        query="SELECT s.*,u.name,f.score,f.comment FROM submissions s JOIN users u ON u.id=s.student_id LEFT JOIN feedback f ON f.submission_id=s.id WHERE s.assignment_id=?"
        if student_id is not None:
            return db.execute(query+" AND s.student_id=?",(assignment_id,student_id)).fetchall()
        return db.execute(query,(assignment_id,)).fetchall()

class LearningFacade:
    def __init__(self, courses, repository, storage, events):
        self.courses,self.repo,self.storage,self.events=courses,repository,storage,events
        self.policies={'strict':StrictDeadlinePolicy(),'allow_late':AllowLatePolicy()}
    def publish_assignment(self, db, user, course_id, title, description, due_at, max_points, policy):
        self.courses.require_lecturer(db,user,course_id)
        if self.repo.course_closed(db,course_id):
            raise DomainError('Course results already released; coursework is closed',409)
        try:
            due=datetime.fromisoformat(due_at)
            if due.tzinfo is None: raise ValueError()
            due=due.astimezone(timezone.utc).isoformat()
        except (ValueError,TypeError): raise DomainError('Enter a valid deadline with timezone')
        if not title.strip() or len(title)>200 or not description.strip() or not 1<=max_points<=1000 or policy not in self.policies:
            raise DomainError('Invalid assignment fields')
        aid=self.repo.create_assignment(db,course_id,title.strip(),description.strip(),due,max_points,policy)
        recipients=self.repo.recipients(db,course_id)
        self.events.publish(db,dict(actor=user.id,action='published',entity=aid,recipients=recipients,message='New assignment: '+title))
        return aid
    def submit(self, db, user, assignment_id, filename, content, at=None):
        assignment=self.repo.assignment(db,assignment_id)
        self.courses.require_student(db,user,assignment['course_id'])
        validate_file(filename,content)
        at=at or datetime.now(timezone.utc)
        late=self.policies[assignment['policy']].evaluate(datetime.fromisoformat(assignment['due_at']),at)
        if self.repo.exists(db,assignment_id,user.id):
            raise DomainError('This assignment has already been submitted',409)
        sid=self.repo.create_submission(db,assignment_id,user.id,filename,at.isoformat(),late)
        self.storage.save(db,sid,content)
        lecturer=self.courses.get(db,assignment['course_id'])['lecturer_id']
        self.events.publish(db,dict(actor=user.id,action='submitted',entity=sid,recipients=[lecturer],message='Submission received: '+assignment['title']))
        return sid
    def grade(self, db, user, submission_id, score, comment):
        sub=self.repo.submission(db,submission_id)
        self.courses.require_lecturer(db,user,sub['course_id'])
        if sub['status']!='submitted': raise DomainError('Submission already graded',409)
        if not 0<=score<=sub['max_points'] or not comment.strip(): raise DomainError('Invalid score or missing feedback')
        self.repo.save_feedback(db,submission_id,user.id,score,comment.strip())
        self.events.publish(db,dict(actor=user.id,action='graded',entity=submission_id,recipients=[sub['student_id']],message='Feedback released'))
    def download(self, db, user, submission_id):
        sub=self.repo.submission(db,submission_id)
        if user.role=='student' and sub['student_id']==user.id:
            self.courses.require_student(db,user,sub['course_id'])
        else: self.courses.require_lecturer(db,user,sub['course_id'])
        return sub['filename'],self.storage.load(db,submission_id)
    def assignments(self, db, user, course_id):
        if user.role=='student': self.courses.require_student(db,user,course_id)
        else: self.courses.require_lecturer(db,user,course_id)
        return self.repo.assignments(db,course_id)
    def submissions(self, db, user, assignment_id):
        assignment=self.repo.assignment(db,assignment_id)
        if user.role=='student':
            self.courses.require_student(db,user,assignment['course_id'])
            return self.repo.submissions(db,assignment_id,user.id)
        self.courses.require_lecturer(db,user,assignment['course_id'])
        return self.repo.submissions(db,assignment_id)
