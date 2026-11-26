"""Local demo web application. Run python -m prototype.app."""
from http.server import HTTPServer, BaseHTTPRequestHandler
from contextlib import closing
from email.parser import BytesParser
from email.policy import default
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, urlsplit, quote
from pathlib import Path
import argparse, os, secrets, json, mimetypes, csv, io
from .db import Database
from .identity import IdentityService, DomainError
from .courses import CourseService
from .learning import LearningFacade, LearningRepository, SQLiteFileAdapter, EventBus, AuditObserver, NotificationObserver, MAX_FILE
from . import views
from .api import CampusAPI

def make_server(path, port=8000):
    database=Database(path); database.initialize()
    identity=IdentityService(); courses=CourseService()
    events=EventBus(); events.subscribe(AuditObserver()); events.subscribe(NotificationObserver())
    learning=LearningFacade(courses,LearningRepository(),SQLiteFileAdapter(),events)
    campus=CampusAPI(courses,learning,events)
    ui_root=Path(__file__).resolve().parent.parent/'ui'/'dist'
    class Handler(BaseHTTPRequestHandler):
        def send(self, status, body, kind='text/html; charset=utf-8', headers=None):
            if isinstance(body,str): body=body.encode()
            self.send_response(status)
            self.send_header('Content-Type',kind)
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('X-Frame-Options','DENY')
            self.send_header('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
            for k,v in (headers or {}).items(): self.send_header(k,v)
            self.end_headers(); self.wfile.write(body)
        def send_json(self,status,data,cookie=None):
            return self.send(status,json.dumps(data), 'application/json; charset=utf-8', {'Set-Cookie':cookie} if cookie else None)
        def send_asset(self,route):
            relative=route.path.removeprefix('/ui/')
            candidate=(ui_root/(relative or 'index.html')).resolve()
            if not candidate.is_relative_to(ui_root.resolve()) or not candidate.is_file():
                raise DomainError('UI build not found',404)
            kind=mimetypes.guess_type(candidate)[0] or 'application/octet-stream'
            # Dedicated CSP for the separately built same-origin SPA.
            content=candidate.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type',kind)
            self.send_header('Content-Length',str(len(content)))
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
            self.end_headers();self.wfile.write(content)
        def redirect(self, cookie=None, location='/'):
            headers={'Location':location}
            if cookie: headers['Set-Cookie']=cookie
            self.send(303,b'',headers=headers)
        def form(self):
            size=int(self.headers.get('Content-Length','0'))
            if not 0<=size<=MAX_FILE+65536: raise DomainError('Request too large',413)
            raw=self.rfile.read(size)
            content_type=self.headers.get('Content-Type','')
            if content_type.startswith('application/json'):
                if size>1024*1024: raise DomainError('JSON request too large',413)
                data=json.loads(raw)
                if not isinstance(data,dict): raise DomainError('Expected JSON object')
                return data
            if content_type.startswith('multipart/form-data'):
                msg=BytesParser(policy=default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
                result={}
                for part in msg.iter_parts():
                    name=part.get_param('name',header='content-disposition')
                    data=part.get_payload(decode=True)
                    if name in result or not name: raise DomainError('Invalid form')
                    result[name]=(part.get_filename(),data) if part.get_filename() is not None else data.decode()
                return result
            if content_type.startswith('application/x-www-form-urlencoded'):
                return {k:v[0] for k,v in parse_qs(raw.decode(),keep_blank_values=True).items()}
            raise DomainError('Unsupported form type',415)
        def token(self):
            cookies=SimpleCookie(); cookies.load(self.headers.get('Cookie',''))
            return cookies['session'].value if 'session' in cookies else ''
        def do_GET(self): self.handle_request(False)
        def do_POST(self): self.handle_request(True)
        def handle_request(self, post):
            try:
                with closing(database.connect()) as db:
                    user,csrf=identity.resolve(db,self.token())
                    route=urlsplit(self.path)
                    is_api=route.path.startswith('/api/')
                    if not post and route.path.startswith('/ui/'):
                        return self.send_asset(route)
                    if not post and route.path=='/api/session':
                        return self.send_json(200,dict(authenticated=bool(user),user=dict(id=user.id,username=user.username,name=user.name,role=user.role) if user else None,csrf=csrf))
                    if not post and route.path=='/api/state':
                        if not user:raise DomainError('Log in first',401)
                        return self.send_json(200,campus.snapshot(db,user,csrf))
                    if post:
                        form=self.form()
                        if route.path in ('/login','/api/login'):
                            # Reject cross-origin browser login requests; localhost demo only.
                            origin=self.headers.get('Origin')
                            if origin and origin != 'http://'+self.headers.get('Host',''): raise DomainError('Invalid origin',403)
                            token=identity.authenticate(db,form.get('username',''),form.get('password',''))
                            cookie='session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600'
                            return self.send_json(200,dict(ok=True),cookie) if is_api else self.redirect(cookie)
                        if not user: raise DomainError('Log in first',401)
                        supplied=self.headers.get('X-CSRF-Token') or form.get('csrf','')
                        if not isinstance(supplied,str) or not secrets.compare_digest(supplied,csrf): raise DomainError('Invalid CSRF token',403)
                        if route.path in ('/logout','/api/logout'):
                            identity.logout(self.token())
                            cookie='session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
                            return self.send_json(200,dict(ok=True),cookie) if is_api else self.redirect(cookie)
                        with db:
                            db.execute('BEGIN IMMEDIATE')
                            action=route.path.removeprefix('/api/actions/') if route.path.startswith('/api/actions/') else route.path.removeprefix('/')
                            campus.command(db,user,action,form)
                        return self.send_json(200,dict(ok=True)) if is_api else self.redirect(location='/campus' if urlsplit(self.headers.get('Referer','')).path=='/campus' else '/')
                    if route.path=='/api/transcript':
                        if not user:raise DomainError('Log in first',401)
                        if user.role!='student':raise DomainError('Student record only',403)
                        record=campus.records.record(db,user.id)
                        output=io.StringIO();writer=csv.writer(output)
                        writer.writerow(['Discivium fictional academic record — not an official transcript'])
                        writer.writerow(['Course','Title','Percentage','Grade','Credits','Released at'])
                        def csv_safe(value):
                            s=str(value)
                            return "'"+s if s.startswith(('=','+','-','@','\\t','\\r')) else s
                        for r in record['results']:writer.writerow([csv_safe(r[k]) for k in ('code','title','percentage','letter','credits','released_at')])
                        writer.writerow(['GPA',record['gpa']])
                        return self.send(200,output.getvalue(),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="discivium-record.csv"'})
                    if route.path in ('/resource-download','/api/resource-download'):
                        if not user:raise DomainError('Log in first',401)
                        rid=int(parse_qs(route.query)['id'][0]);filename,content=campus.resources.download(db,user,rid)
                        return self.send(200,content,'application/octet-stream',{'Content-Disposition':"attachment; filename*=UTF-8''"+quote(filename,safe='')})
                    if route.path in ('/download','/api/download'):
                        if not user: raise DomainError('Log in first',401)
                        sid=int(parse_qs(route.query)['id'][0])
                        filename,content=learning.download(db,user,sid)
                        return self.send(200,content,'application/octet-stream',{'Content-Disposition':"attachment; filename*=UTF-8''"+quote(filename,safe='')})
                    if route.path=='/campus':
                        if not user: raise DomainError('Log in first',401)
                        return self.send(200,views.campus_dashboard(campus.snapshot(db,user,csrf)))
                    if route.path!='/': raise DomainError('Page not found',404)
                    return self.send(200,views.dashboard(db,user,csrf,courses,learning) if user else views.login())
            except DomainError as e:
                if self.path.startswith('/api/'): self.send_json(e.status,dict(error=str(e)))
                else:self.send(e.status,views.error(str(e)))
            except (ValueError,KeyError,TypeError,UnicodeError,AttributeError):
                if self.path.startswith('/api/'):self.send_json(400,dict(error='Invalid or missing request fields'))
                else:self.send(400,views.error('Invalid or missing request fields'))
            except Exception:
                import traceback; traceback.print_exc()
                if self.path.startswith('/api/'):self.send_json(500,dict(error='Unexpected error'))
                else:self.send(500,views.error('Unexpected error. No successful transaction was reported.'))
    return HTTPServer(('127.0.0.1',port),Handler)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--db',default=str(Path(__file__).parent/'runtime'/'discivium.sqlite3'))
    args=parser.parse_args()
    server=make_server(args.db,args.port)
    print(f'Discivium local demo: http://127.0.0.1:{args.port}',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
