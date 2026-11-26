"""AcademicRecordsService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class AcademicRecordsService:
    """Course results are lecturer-released; GPA is derived, never client-supplied."""
    def __init__(self,courses,bus): self.courses,self.bus=courses,bus
    def release(self,db,user,cid,sid):
        self.courses.require_lecturer(db,user,cid)
        if not db.execute("SELECT 1 FROM enrollments WHERE course_id=? AND student_id=?",(cid,sid)).fetchone():
            raise DomainError('Student not enrolled',403)
        if db.execute("SELECT 1 FROM course_results WHERE course_id=? AND student_id=?",(cid,sid)).fetchone():
            raise DomainError('Course result already released',409)
        marks=one(db,"""SELECT COUNT(a.id) AS total,COUNT(f.submission_id) AS graded,
            COALESCE(SUM(f.score),0) AS earned,COALESCE(SUM(a.max_points),0) AS possible
            FROM assignments a LEFT JOIN submissions s ON s.assignment_id=a.id AND s.student_id=?
            LEFT JOIN feedback f ON f.submission_id=s.id WHERE a.course_id=?""",(sid,cid))
        if not marks['total'] or marks['graded']!=marks['total']: raise DomainError('All published assignments must be graded before releasing result',409)
        credits=one(db,"SELECT credits FROM offerings WHERE course_id=?",(cid,))['credits']
        pct=round(100*marks['earned']/marks['possible'],2)
        db.execute("INSERT INTO course_results VALUES (?,?,?,?,?)",(sid,cid,pct,credits,now()))
        event(self.bus,db,user,'result_released',cid,[sid],'Course result released')
    @staticmethod
    def letter(pct):
        for threshold,letter,points in [(93,'A',4),(90,'A-',3.7),(87,'B+',3.3),(83,'B',3),(80,'B-',2.7),(77,'C+',2.3),(73,'C',2),(70,'C-',1.7),(60,'D',1)]:
            if pct>=threshold:return letter,points
        return 'F',0
    def record(self,db,sid):
        result=rows(db,"""SELECT c.id AS course_id,c.code,c.title,r.percentage,r.credits,r.released_at
            FROM course_results r JOIN courses c ON c.id=r.course_id WHERE r.student_id=? ORDER BY r.released_at DESC""",(sid,))
        for r in result:r['letter'],r['grade_points']=self.letter(r['percentage'])
        credits=sum(r['credits'] for r in result)
        gpa=round(sum(r['grade_points']*r['credits'] for r in result)/credits,2) if credits else None
        return dict(results=result,gpa=gpa,attempted_credits=credits,earned_credits=sum(r['credits'] for r in result if r['percentage']>=60),
                    programme=rows(db,"SELECT p.name,p.department FROM programmes p JOIN student_programmes s ON s.programme_id=p.id WHERE s.student_id=?",(sid,)))

