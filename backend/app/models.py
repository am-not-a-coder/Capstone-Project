from app import db

class Employee(db.Model):
    __tablename__ = 'employee'

    employeeID = db.Column(db.Integer, primary_key=True, nullable=False)
    programID = db.Column(db.Integer, nullable=False)
    areaID = db.Column(db.Integer, nullable=False)
    fName = db.Column(db.String(50), nullable=False)
    lName = db.Column(db.String(50))
    suffix = db.Column(db.String(10))
    email = db.Column(db.String(120), nullable=False)
    contactNum = db.Column(db.String(20))
    password = db.Column(db.String(128), nullable=False)
    profilePic = db.Column(db.Text)
    isAdmin = db.Column(db.Boolean, default=False)
    isOnline = db.Column(db.Boolean, default=False)

class Area(db.Model):
    __tablename__ = 'area'

    areaID = db.Column(db.Integer, primary_key=True, nullable=False)
    programID = db.Column(db.Integer, nullable=False)
    areaName = db.Column(db.String(100))
    areaNum = db.Column(db.String(10))
    progress = db.Column(db.Integer)
    subareaID = db.Column(db.Integer)

    subareas = db.relationship("Subarea", back_populates="area", cascade="all, delete-orphan")

class Program(db.Model):
    __tablename__ = 'program'

    programID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.Integer, db.ForeignKey('employee.employeeID'))
    programCode = db.Column(db.String(20))
    programName = db.Column(db.String(100))
    programColor = db.Column(db.String(30))
    
    dean = db.relationship("Employee", backref="programs")

class Subarea(db.Model):
    __tablename__ = 'subarea'

    subareaID = db.Column(db.Integer, primary_key=True, nullable=False)
    areaID = db.Column(db.Integer, db.ForeignKey('area.areaID'), nullable=False)
    subareaName = db.Column(db.String(100))
    criteriaID = db.Column(db.Integer)

    area = db.relationship("Area", back_populates="subareas")

    criteria = db.relationship("Criteria", back_populates="subarea", cascade="all, delete-orphan")

class Criteria(db.Model):
    __tablename__ = 'criteria'

    criteriaID = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    subareaID = db.Column(db.Integer, db.ForeignKey('subarea.subareaID'), nullable=False)
    criteriaContent = db.Column(db.Text)
    criteriaType = db.Column(db.String(50))
    docID = db.Column(db.Integer)

    subarea = db.relationship("Subarea", back_populates="criteria")
class Institute(db.Model):
    __tablename__ = 'institute'

    instID = db.Column(db.Integer, primary_key=True, nullable=False)
    programID = db.Column(db.Integer, nullable=False)
    employeeID = db.Column(db.Integer, nullable=False)
    instCode = db.Column(db.String(50), nullable=False)
    instName = db.Column(db.String(100), nullable=False)
    instPic = db.Column(db.Text)

class Document(db.Model):
    __tablename__ = 'document'

    docID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.Integer, nullable=False)
    docName = db.Column(db.String(150), nullable=False)
    docType = db.Column(db.String(50), nullable=False)
    docTag = db.Column(db.String(50), nullable=False)
    docPath = db.Column(db.Text)
    isApproved = db.Column(db.Boolean, default=False)

class Deadline(db.Model):
    __tablename__ = 'deadline'

    deadlineID = db.Column(db.Integer, primary_key=True, nullable=False)
    programID = db.Column(db.Integer, nullable=False)
    areaID = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.Date, nullable=False)

class AuditLog(db.Model):
    __tablename__ = 'audit_log'

    logID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)

class Announcement(db.Model):
    __tablename__ = 'announcement'

    announceID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.Integer, nullable=False)
    announceText = db.Column(db.Text)
    duration = db.Column(db.Date)