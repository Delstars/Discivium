def seed_campus(db):
    for row in [(3,'BCS310','Algorithms I',1),(4,'BCS320','Computer Networks',6),(5,'BCS330','Advanced Algorithms',1),(6,'BCS340','Human Computer Interaction',6),(7,'BCS200','Programming II',1)]:
        db.execute("INSERT OR IGNORE INTO courses VALUES (?,?,?,?)",row)
    for row in [(1,3,30,0,540,630,'B-204','Fall 2026'),(2,3,30,1,600,690,'B-205','Fall 2026'),(3,3,25,2,600,690,'A-101','Fall 2026'),(4,3,25,3,540,630,'A-105','Fall 2026'),(5,3,25,4,600,690,'B-204','Fall 2026'),(6,3,25,0,570,660,'C-102','Fall 2026'),(7,3,30,4,780,870,'A-102','Spring 2026')]:
        db.execute("INSERT OR IGNORE INTO offerings VALUES (?,?,?,?,?,?,?,?)",row)
    db.execute("INSERT OR IGNORE INTO prerequisites VALUES (3,7)")
    db.execute("INSERT OR IGNORE INTO prerequisites VALUES (5,3)")
    db.execute("INSERT OR IGNORE INTO course_results VALUES (2,7,88,3,'2026-05-15T08:00:00+00:00')")
    db.execute("INSERT OR IGNORE INTO invoices VALUES (1,2,'Fall 2026 tuition instalment',450000,'2026-12-10')")
    db.execute("INSERT OR IGNORE INTO invoices VALUES (2,2,'Library and student services',15000,'2026-12-10')")
    db.execute("INSERT OR IGNORE INTO invoices VALUES (3,3,'Fall 2026 tuition instalment',450000,'2026-12-10')")
    db.execute("INSERT OR IGNORE INTO advisor_assignments VALUES (2,5,0)")
    db.execute("INSERT OR IGNORE INTO advisor_assignments VALUES (3,5,0)")
    db.execute("INSERT OR IGNORE INTO programmes VALUES (1,'BSc Computer Science','Engineering and Technology')")
    db.execute("INSERT OR IGNORE INTO student_programmes VALUES (2,1)")
    db.execute("INSERT OR IGNORE INTO student_programmes VALUES (3,1)")
