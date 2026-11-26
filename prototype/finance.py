"""FinanceService module."""
import json
from datetime import date
from .identity import DomainError
from .db import now
from .campus_common import rows,one,role,text,integer,event,require_member

class FinanceService:
    """Fictional ledger only: amounts are integer fils; no payment network."""
    def __init__(self,bus):self.bus=bus
    def ledger(self,db,user):
        role(user,'student','admin')
        where="WHERE i.student_id=?" if user.role=='student' else ""
        return rows(db,f"""SELECT i.*,u.name AS student_name,p.id AS payment_id,p.recorded_at AS paid_at,
            CASE WHEN p.id IS NULL THEN 'unpaid' ELSE 'paid' END AS status
            FROM invoices i JOIN users u ON u.id=i.student_id LEFT JOIN payments p ON p.invoice_id=i.id {where} ORDER BY i.id""",
            (user.id,) if user.role=='student' else ())
    def pay(self,db,user,iid):
        role(user,'student')
        invoice=one(db,"SELECT * FROM invoices WHERE id=?",(iid,))
        if invoice['student_id']!=user.id:raise DomainError('Invoice not owned by student',403)
        if db.execute("SELECT 1 FROM payments WHERE invoice_id=?",(iid,)).fetchone():raise DomainError('Invoice already settled',409)
        pid=db.execute("INSERT INTO payments(invoice_id,amount_fils,recorded_at) VALUES (?,?,?)",(iid,invoice['amount_fils'],now())).lastrowid
        event(self.bus,db,user,'simulated_payment',pid,[user.id],'Demo invoice settled; no real money moved')
        return pid
    def issue(self,db,user,sid,title,amount,due):
        role(user,'admin')
        one(db,"SELECT id FROM users WHERE id=? AND role='student'",(sid,))
        try:date.fromisoformat(due)
        except (ValueError,TypeError):raise DomainError('Invalid invoice due date')
        iid=db.execute("INSERT INTO invoices(student_id,title,amount_fils,due_date) VALUES (?,?,?,?)",(sid,text(title,150),integer(amount),due)).lastrowid
        event(self.bus,db,user,'invoice_issued',iid,[sid],'New demo invoice issued')
        return iid

