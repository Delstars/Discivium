"""Presentation only: HTML escaping, forms and role-specific read views."""
from html import escape
from datetime import datetime, timedelta, timezone
def e(x): return escape(str(x),quote=True)
def hidden(name,value): return f'<input type="hidden" name="{e(name)}" value="{e(value)}">'
def page(title,body):
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{e(title)} · Discivium</title><style>
    *{{box-sizing:border-box}}body{{margin:0;background:#f3f5f9;color:#18243a;font:16px system-ui,sans-serif}}header{{background:#192843;color:white;padding:22px max(20px,calc((100% - 1080px)/2));display:flex;justify-content:space-between;gap:12px}}header b{{font-size:22px;letter-spacing:1px}}main{{max-width:1080px;margin:auto;padding:24px}}section,article{{background:white;border:1px solid #dce2ed;border-radius:14px;padding:20px;margin:16px 0}}article{{background:#f8faff}}h1,h2,h3{{margin:0 0 12px}}p{{line-height:1.5}}small{{color:#5d6980}}label{{display:block;margin:10px 0 4px;font-weight:600}}input,select,textarea{{font:inherit;display:block;width:100%;padding:10px;border:1px solid #b9c5d5;border-radius:8px;background:white}}button{{border:0;background:#245c91;color:white;padding:11px 17px;border-radius:8px;font:inherit;cursor:pointer;margin:12px 0}}header button{{margin:0;background:#385272}}a{{color:#245c91}}.tag{{display:inline-block;background:#e4edf9;padding:5px 10px;border-radius:20px;font-size:13px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}}.login{{max-width:480px;margin:30px auto}}.muted{{color:#5d6980}}details{{margin:12px 0}}summary{{cursor:pointer;font-weight:600}}footer{{text-align:center;color:#5d6980;padding:20px}}
    </style><header><b>DISCIVIUM / Campus</b><span>BCS305 · Local demonstration</span></header><main>{body}</main><footer>Fictional academic records · Independent course prototype</footer></html>'''
def login():
    return page('Sign in','''<section class="login"><h1>Welcome to Discivium</h1><p>University coursework and academic services.</p><form method="post" action="/login"><label>Username<input name="username" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button>Sign in</button></form><small>Demo accounts: lecturer, student, other, lecturer2, admin, advisor. Password: DemoOnly!2026. Use fictional data only.</small></section>''')
def error(message):
    return page('Request rejected',f'<section><h1>Request rejected</h1><p>{e(message)}</p><a href="/">Return to dashboard</a></section>')
def form(action,csrf,body,upload=False):
    enctype=' enctype="multipart/form-data"' if upload else ''
    return f'<form method="post" action="/{action}"{enctype}>{hidden("csrf",csrf)}{body}</form>'
def dashboard(db,user,csrf,courses,learning):
    chunks=[f'<h1>Welcome, {e(user.name)}</h1><span class="tag">{e(user.role.title())}</span>',form('logout',csrf,'<button>Sign out</button>')]
    chunks.append('<p><a href="/campus">Open full campus dashboard →</a></p>')
    if user.role=='admin':
        chunks.append('<section><h2>Enrollment administration</h2><p>Assign a student to a course.</p>')
        co=''.join(f'<option value="{r["id"]}">{e(r["code"]+" "+r["title"])}</option>' for r in db.execute('SELECT * FROM courses'))
        st=''.join(f'<option value="{r["id"]}">{e(r["name"])}</option>' for r in db.execute("SELECT * FROM users WHERE role='student'"))
        chunks.append(form('enroll',csrf,f'<label>Course<select name="course_id">{co}</select></label><label>Student<select name="student_id">{st}</select></label><button>Enroll student</button>'))
        chunks.append('</section>')
    elif user.role=='advisor':
        chunks.append('<section><h2>Academic advising</h2><p>Open the full campus dashboard to see assigned students and consent-controlled advising records.</p></section>')
    else:
        for course in courses.visible(db,user):
            cid=course['id']
            chunks.append(f'<section><span class="tag">{e(course["code"])}</span><h2>{e(course["title"])}</h2>')
            if user.role=='lecturer':
                deadline=(datetime.now(timezone(timedelta(hours=4)))+timedelta(days=2)).strftime('%Y-%m-%dT%H:%M')
                chunks.append('<details open><summary>Publish an assignment</summary>'+form('publish',csrf,hidden('course_id',cid)+f'<label>Title<input name="title" required maxlength="200"></label><label>Description<textarea name="description" required></textarea></label><label>Deadline (UAE time)<input type="datetime-local" name="due_at" value="{deadline}" required></label><label>Maximum points<input name="max_points" type="number" min="1" max="1000" value="100" required></label><label>Deadline policy<select name="policy"><option value="allow_late">Allow late submissions</option><option value="strict">Reject late submissions</option></select></label><button>Publish assignment</button>')+'</details>')
            for a in learning.assignments(db,user,cid):
                aid=a['id']; subs=learning.submissions(db,user,aid)
                local_due=datetime.fromisoformat(a['due_at']).astimezone(timezone(timedelta(hours=4))).strftime('%d %b %Y %H:%M UAE')
                chunks.append(f'<article><h3>{e(a["title"])}</h3><p>{e(a["description"])}</p><small>Due {e(local_due)} · {a["max_points"]} points · {e(a["policy"])}</small>')
                if user.role=='student' and not subs:
                    chunks.append(form('submit',csrf,hidden('assignment_id',aid)+'<label>Assignment file (PDF or DOCX)<input type="file" name="file" accept=".pdf,.docx" required></label><button>Submit assignment</button>',True))
                for s in subs:
                    status=s['status']+(' · late' if s['late'] else '')
                    chunks.append(f'<p><b>{e(s["name"])}</b> · <span class="tag">{e(status)}</span> · <a href="/download?id={s["id"]}">{e(s["filename"])}</a></p>')
                    if s['status']=='graded':
                        chunks.append(f'<p><b>Feedback: {s["score"]}/{a["max_points"]}</b><br>{e(s["comment"])}</p>')
                    elif user.role=='lecturer':
                        chunks.append(form('grade',csrf,hidden('submission_id',s['id'])+f'<label>Score<input type="number" name="score" min="0" max="{a["max_points"]}" required></label><label>Feedback<textarea name="comment" required></textarea></label><button>Release feedback</button>'))
                chunks.append('</article>')
            chunks.append('</section>')
    chunks.append('<section><h2>Notifications</h2>')
    for n in db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 20',(user.id,)):
        chunks.append(f'<p>{e(n["message"])} <small>{e(n["created_at"][:10])}</small></p>')
    chunks.append('</section>')
    return page('Dashboard',''.join(chunks))

def campus_dashboard(state):
    """Functional no-JavaScript fallback, independent of the upcoming React UI."""
    from datetime import date
    user=state['user']; csrf=state['csrf']; role=user['role']
    out=[f'<h1>Campus dashboard · {e(user["name"])}</h1><p><a href="/">Coursework home</a> · <span class="tag">{e(role)}</span></p>']
    def section(title):out.append(f'<section><h2>{e(title)}</h2>')
    def end():out.append('</section>')
    def fields(label,name,kind='text',value='',required=True):
        return f'<label>{e(label)}<input name="{e(name)}" type="{e(kind)}" value="{e(value)}" {"required" if required else ""}></label>'
    def choice(label,name,options):
        return f'<label>{e(label)}<select name="{e(name)}">'+''.join(f'<option value="{e(k)}">{e(v)}</option>' for k,v in options)+'</select></label>'
    def action(name,values,body='',button=None):
        content=''.join(hidden(k,v) for k,v in values.items())+body+f'<button>{e(button or name.replace("-"," ").title())}</button>'
        out.append(form(name,csrf,content))
    def item(body):out.append('<article>'+body+'</article>')
    def table(headers,data):
        out.append('<div style="overflow:auto"><table style="border-collapse:collapse;width:100%"><thead><tr>'+''.join(f'<th style="text-align:left;padding:8px;border-bottom:1px solid #ccc">{e(h)}</th>' for h in headers)+'</tr></thead><tbody>')
        for row in data:out.append('<tr>'+''.join(f'<td style="padding:8px;border-bottom:1px solid #ddd">{e(v if v is not None else "—")}</td>' for v in row)+'</tr>')
        out.append('</tbody></table></div>')
    def time(n):return f'{n//60:02}:{n%60:02}'
    if role in ('student','lecturer'):
        section('Timetable')
        days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        table(['Course','Day','Time','Room'],[(r['code'],days[r['weekday']],time(r['start_min'])+' – '+time(r['end_min']),r['room']) for r in state['timetable']]);end()
        if role=='student':
            section('Registration')
            for c in state['catalogue']:
                item(f'<b>{e(c["code"])} · {e(c["title"])}</b><p>{c["credits"]} credits · {c["occupied"]}/{c["capacity"]} seats · {e(days[c["weekday"]])} {time(c["start_min"])} – {time(c["end_min"])}</p><small>Prerequisites: {e(", ".join(p["code"] for p in c["prerequisites"]) or "None")}</small>')
                if not c['enrolled']:action('register',{'course_id':c['id']},button='Register')
                else:out.append('<span class="tag">Enrolled</span>')
            end()
            section('Academic record / Scholar Passport')
            record=state['record'];out.append(f'<p>GPA: <b>{e(record["gpa"])}</b> · Earned credits: {record["earned_credits"]} · Fictional academic record</p>')
            table(['Course','Percentage','Grade','Credits'],[(r['code'],r['percentage'],r['letter'],r['credits']) for r in record['results']]);out.append('<a href="/api/transcript">Export fictional academic record (CSV)</a>');end()
            section('Attendance')
            out.append(f'<p>Attendance rate: {e(state["attendance"]["rate"] if state["attendance"]["rate"] is not None else "No marks yet")} (present and late count; excused excluded)</p>')
            table(['Course','Date','Session','Status'],[(r['code'],r['session_date'],r['title'],r['status']) for r in state['attendance']['items']]);end()
        for c in state['courses']:
            section(c['code']+' · '+c['title']+' workspace')
            if role=='lecturer':
                out.append('<h3>Attendance and results</h3>')
                action('attendance-session',{'course_id':c['id']},fields('Date','date','date',date.today().isoformat())+fields('Session title','title'),button='Create session')
                for session in c['attendance_sessions']:
                    out.append(f'<p><b>{e(session["title"])} · {e(session["session_date"])}</b></p>')
                    for student in c['roster']:
                        current=next((m['status'] for m in session['marks'] if m['student_id']==student['id']),'unmarked')
                        action('attendance-mark',{'session_id':session['id'],'student_id':student['id']},f'<p>{e(student["name"])} · {e(current)}</p>'+choice('Status','status',[(s,s.title()) for s in ('present','absent','late','excused')]),button='Save attendance')
                for student in c['roster']:
                    r=next((x for x in c['released_results'] if x['student_id']==student['id']),None)
                    if r:out.append(f'<p>{e(student["name"])} · Released: {r["percentage"]}%</p>')
                    else:action('release-result',{'course_id':c['id'],'student_id':student['id']},f'<p>{e(student["name"])}</p>',button='Release final course result')
            out.append('<h3>Course resources</h3>')
            for resource in c['resources']:
                item(f'<a href="/resource-download?id={resource["id"]}">{e(resource["title"])}</a> · {e(resource["filename"])}')
            if role=='lecturer':
                out.append(form('resource',csrf,hidden('course_id',c['id'])+fields('Resource title','title')+'<label>Document<input type="file" name="file" accept=".pdf,.docx" required></label><button>Publish resource</button>',True))
            out.append('<h3>Course discussion</h3>')
            for m in c['workspace']['messages']:item(f'<b>{e(m["author_name"])}</b><p>{e(m["body"])}</p><small>{e(m["created_at"])}</small>')
            action('message',{'course_id':c['id']},fields('Message','body'),button='Post message')
            out.append('<h3>Course polls</h3>')
            if role=='lecturer':
                action('form',{'course_id':c['id']},fields('Title','title')+fields('Question','question')+fields('Options separated by |','options'),button='Create poll')
            for poll in c['workspace']['forms']:
                item(f'<b>{e(poll["title"])}</b><p>{e(poll["question"])}</p><small>{"Open" if poll["open"] else "Closed"}</small>')
                if role=='lecturer':
                    table(['Option','Responses'],zip(poll['options'],poll['counts']))
                    if poll['open']:action('form-close',{'form_id':poll['id']},button='Close poll')
                elif poll['my_choice'] is not None:out.append(f'<p>Your response: {e(poll["options"][poll["my_choice"]])}</p>')
                elif poll['open']:action('form-response',{'form_id':poll['id']},choice('Choose response','choice',enumerate(poll['options'])),button='Submit response')
            end()
    if role in ('student','admin'):
        section('Student finance · simulated only')
        for inv in state['finance']:
            item(f'<b>{e(inv["title"])}</b><p>{e(inv["student_name"])} · AED {inv["amount_fils"]/100:,.2f} · {e(inv["status"])} · Due {e(inv["due_date"])}</p>')
            if role=='student' and inv['status']=='unpaid':action('pay',{'invoice_id':inv['id']},button='Record simulated payment')
        if role=='admin':
            students=[(x['id'],x['name']) for x in state['governance']['people'] if x['role']=='student']
            action('invoice',{},choice('Student','student_id',students)+fields('Title','title')+fields('Amount in fils (100 fils = AED 1)','amount_fils','number')+fields('Due date','due_date','date'),button='Issue invoice')
        end()
        section('Campus services')
        if role=='student':action('request',{},choice('Category','category',[(s,s.replace('_',' ').title()) for s in ('transcript','enrollment_letter','it_support','general')])+fields('Subject','subject')+fields('Description','description'),button='Submit request')
        for r in state['requests']:
            item(f'<b>{e(r["subject"])}</b><p>{e(r["description"])} · {e(r["status"])}</p><p>{e(r["decision"] or "")}</p>')
            if r['status'] in ('pending','in_review'):
                if role=='student':action('request-status',{'request_id':r['id'],'status':'cancelled'},button='Cancel request')
                else:
                    options=[('in_review','In review'),('rejected','Rejected')] if r['status']=='pending' else [('resolved','Resolved'),('rejected','Rejected')]
                    action('request-status',{'request_id':r['id']},choice('Next status','status',options)+fields('Decision note','note',required=False),button='Update request')
        end()
    if role=='student':
        section('Advising consent')
        for a in state['advising']['advisors']:
            item(f'<b>{e(a["name"])}</b><p>Consent: {"Granted" if a["consent"] else "Not granted"}</p>')
            action('consent',{'advisor_id':a['id'],'enabled':0 if a['consent'] else 1},button='Revoke access' if a['consent'] else 'Grant access')
        for note in state['advising']['notes']:item(f'<b>{e(note["advisor_name"])}</b><p>{e(note["note"])}</p>')
        end()
    if role=='advisor':
        section('Assigned advisees')
        for a in state['advisees']:
            item(f'<b>{e(a["name"])}</b><p>Consent: {"Granted" if a["consent"] else "Not granted — records withheld"}</p>')
            if a['consent']:
                out.append(f'<p>GPA: {e(a["record"]["gpa"])} · Attendance: {e(a["attendance"]["rate"])} · Flags: {e(", ".join(a["risk_reasons"]) or "None recorded")}</p>')
                table(['Course','Grade','Credits'],[(r['code'],r['letter'],r['credits']) for r in a['record']['results']])
                for note in a['notes']:item(e(note['note']))
                action('advising-note',{'student_id':a['id']},fields('Shared advising note','note'),button='Save note')
        end()
    if role=='admin':
        g=state['governance'];people=g['people']
        students=[(u['id'],u['name']) for u in people if u['role']=='student']
        lecturers=[(u['id'],u['name']) for u in people if u['role']=='lecturer']
        advisors=[(u['id'],u['name']) for u in people if u['role']=='advisor']
        section('Academic structure')
        table(['Code','Title','Capacity','Semester'],[(c['code'],c['title'],c['capacity'],c['semester']) for c in g['courses']])
        action('course',{},fields('Code','code')+fields('Title','title')+choice('Lecturer','lecturer_id',lecturers)+fields('Credits','credits','number','3')+fields('Capacity','capacity','number','30')+choice('Weekday','weekday',enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']))+fields('Start minutes after midnight','start_min','number','540')+fields('End minutes','end_min','number','630')+fields('Room','room'),button='Create course')
        action('enroll',{},choice('Student','student_id',students)+choice('Course','course_id',[(c['id'],c['code']) for c in g['courses']]),button='Enroll student')
        table(['Programme','Department'],[(p['name'],p['department']) for p in g['programmes']])
        action('programme',{},fields('Programme','name')+fields('Department','department'))
        action('assign-programme',{},choice('Student','student_id',students)+choice('Programme','programme_id',[(p['id'],p['name']) for p in g['programmes']]))
        action('assign-advisor',{},choice('Student','student_id',students)+choice('Advisor','advisor_id',advisors))
        end()
        section('People directory and audit')
        table(['Name','Username','Role'],[(u['name'],u['username'],u['role']) for u in people])
        action('user',{},fields('Username','username')+fields('Display name','name')+choice('Role','role',[(s,s.title()) for s in ('student','lecturer','advisor','admin')])+fields('Fictional password (10+ characters)','password','password'),button='Create demo user')
        table(['Time','Actor','Action','Entity'],[(a['created_at'],a['actor_name'],a['action'],a['entity_id']) for a in g['audit']]);end()
    section('Notifications')
    for n in state['notifications']:
        item(e(n['message'])+(' · Read' if n['read_at'] else ' · New'))
        if not n['read_at']:action('notification-read',{'notification_id':n['id']},button='Mark read')
    end()
    return page('Campus dashboard',''.join(out))
