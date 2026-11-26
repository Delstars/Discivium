"""Reproducible local quality-scenario measurements. Disposable fictional database."""
import argparse, json, math, statistics, subprocess, sys, tempfile, time, urllib.request, http.cookiejar
from pathlib import Path
from urllib.error import URLError

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8087)
    args=parser.parse_args()
    base=f'http://127.0.0.1:{args.port}'
    with tempfile.TemporaryDirectory() as d:
        db=Path(d)/'benchmark.sqlite3'
        def launch():
            p=subprocess.Popen([sys.executable,'-m','prototype.app','--port',str(args.port),'--db',str(db)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            try:
                for _ in range(300):
                    try:
                        with urllib.request.urlopen(base+'/api/session',timeout=.5) as r:
                            if r.status==200:return p
                    except (URLError,TimeoutError):time.sleep(.1)
                    if p.poll() is not None:raise RuntimeError('Server failed to start')
                raise RuntimeError('Startup timeout')
            except BaseException:
                p.terminate();p.wait();raise
        def stop(p):
            p.terminate();p.wait(timeout=10)
        def account(name):
            jar=http.cookiejar.CookieJar()
            client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
            def request(path,body=None,csrf=None,content='application/json'):
                headers={'Content-Type':content}
                if csrf:headers['X-CSRF-Token']=csrf
                raw=json.dumps(body).encode() if isinstance(body,dict) else body
                with client.open(urllib.request.Request(base+path,data=raw,headers=headers),timeout=15) as r:
                    return json.loads(r.read())
            request('/api/login',{'username':name,'password':'DemoOnly!2026'})
            return request,request('/api/session')['csrf']
        p=launch()
        try:
            lecturer,lcsrf=account('lecturer');student,scsrf=account('student')
            for i in range(20):
                lecturer('/api/actions/publish',dict(course_id=1,title=f'Benchmark {i}',description='Fictional performance test',due_at='2099-01-01T12:00:00+04:00',max_points=30,policy='strict'),lcsrf)
            ids=[a['id'] for a in student('/api/state')['courses'][0]['assignments']]
            sample=b'%PDF-1.4\n'+b' '* (1024*1024-15)+b'%%EOF\n'
            assert len(sample)==1024*1024
            timings=[]
            for aid in ids:
                b='discivium-benchmark-boundary'
                raw=(f'--{b}\r\nContent-Disposition: form-data; name="assignment_id"\r\n\r\n{aid}\r\n--{b}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n').encode()+sample+f'\r\n--{b}--\r\n'.encode()
                begin=time.perf_counter()
                assert student('/api/actions/submit',raw,scsrf,'multipart/form-data; boundary='+b)['ok']
                timings.append(time.perf_counter()-begin)
            stop(p);p=None
            begin=time.perf_counter();p=launch()
            student,_=account('student')
            found=sum(len(a['submissions']) for c in student('/api/state')['courses'] for a in c['assignments'])
            restart=time.perf_counter()-begin
            assert found==20
            data=dict(environment='single GitHub-hosted Linux runner; loopback HTTP; SQLite; one active upload at a time; synthetic 1 MiB PDF-header payload',runs=len(timings),median_seconds=round(statistics.median(timings),4),p95_seconds=round(sorted(timings)[math.ceil(.95*len(timings))-1],4),within_3_seconds=sum(t<=3 for t in timings),restart_and_read_seconds=round(restart,4),persistent_submissions=found,performance_target_met=sum(t<=3 for t in timings)>=19,restart_target_met=restart<=30)
            print(json.dumps(data,indent=2))
        finally:
            if p is not None:stop(p)
if __name__=='__main__':main()
