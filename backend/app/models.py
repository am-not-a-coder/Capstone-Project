from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import TSVECTOR, ARRAY
from sqlalchemy.types import UserDefinedType
class Vector(UserDefinedType):
    def __init__(self, dimensions):
        self.dimensions = dimensions

    def get_col_spec(self, **kw):
        return f"vector({self.dimensions})"

    def bind_processor(self, dialect):
        def process(value):
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return value
        return process


class Employee(db.Model):
    __tablename__ = 'employee'

    employeeID = db.Column(db.String(10), primary_key=True, nullable=False)
    programID = db.Column(db.Integer, db.ForeignKey('program.programID'), nullable=False)
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
    experiences = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # MFA/OTP fields
    otpcode = db.Column(db.String(6))
    otpexpiry = db.Column(db.DateTime(timezone=True))
    otpverified = db.Column(db.Boolean, default=False)
    # Relationships
    program = db.relationship("Program", foreign_keys=[programID], backref="employees")

class Area(db.Model):
    __tablename__ = 'area'

    areaID = db.Column(db.Integer, primary_key=True, nullable=False)
    instID = db.Column(db.Integer, db.ForeignKey('institute.instID'), nullable=True)
    instID = db.Column(db.Integer, db.ForeignKey('institute.instID'), nullable=True)
    programID = db.Column(db.Integer, db.ForeignKey('program.programID'), nullable=False)
    areaName = db.Column(db.String(100))
    areaNum = db.Column(db.String(10))
    progress = db.Column(db.Integer)
    subareaID = db.Column(db.Integer)
    rating = db.Column(db.Float)

    program = db.relationship("Program", back_populates="areas")
    subareas = db.relationship("Subarea", back_populates="area", cascade="all, delete-orphan")
    institute = db.relationship("Institute", back_populates="areas")
    

class Program(db.Model):
    __tablename__ = 'program'

    programID = db.Column(db.Integer, primary_key=True, nullable=False)
    instID = db.Column(db.Integer, db.ForeignKey('institute.instID'), nullable=True)
    employeeID = db.Column(db.String(10), db.ForeignKey('employee.employeeID'))
    programCode = db.Column(db.String(20))
    programName = db.Column(db.String(100))
    programColor = db.Column(db.String(30))

    dean = db.relationship("Employee", foreign_keys=[employeeID], backref="programs")
    institute = db.relationship("Institute", back_populates="programs")
    areas = db.relationship("Area", back_populates="program", cascade="all, delete-orphan")
    
    institute = db.relationship("Institute", foreign_keys=[instID], backref="programs")


class Subarea(db.Model):
    __tablename__ = 'subarea'

    subareaID = db.Column(db.Integer, primary_key=True, nullable=False)
    areaID = db.Column(db.Integer, db.ForeignKey('area.areaID'), nullable=False)
    subareaName = db.Column(db.String(100))
    criteriaID = db.Column(db.Integer)
    rating = db.Column(db.Float)

    area = db.relationship("Area", back_populates="subareas")

    criteria = db.relationship("Criteria", back_populates="subarea", cascade="all, delete-orphan")

class Criteria(db.Model):
    __tablename__ = 'criteria'

    criteriaID = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    subareaID = db.Column(db.Integer, db.ForeignKey('subarea.subareaID'), nullable=False)
    criteriaContent = db.Column(db.Text)
    criteriaType = db.Column(db.String(50))
    rating = db.Column(db.Float)
    isDone = db.Column(db.Boolean, default=False)
    docID = db.Column(db.Integer, db.ForeignKey('document.docID'), nullable=False)

    subarea = db.relationship("Subarea", back_populates="criteria")    

    document = db.relationship("Document", back_populates="criteria")

class Deadline(db.Model):
    __tablename__ = "deadline"

    deadlineID = db.Column(db.Integer, primary_key=True)
    programID = db.Column(db.Integer, db.ForeignKey("program.programID"), nullable=False)
    areaID = db.Column(db.Integer, db.ForeignKey("area.areaID"), nullable=False)
    criteriaID = db.Column(db.Integer, db.ForeignKey("criteria.criteriaID"), nullable=False)
    content = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
      

class Document(db.Model):
    __tablename__ = 'document'

    docID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.String(10), nullable=False)
    docName = db.Column(db.String(150), nullable=False)
    docType = db.Column(db.String(50), nullable=False)    
    docPath = db.Column(db.Text)
    isApproved = db.Column(db.Boolean)
    approvedBy = db.Column(db.String(10), db.ForeignKey('employee.employeeID'))
    evaluate_at = db.Column(db.DateTime)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    content = db.Column(db.Text)
    search_vector = db.Column(TSVECTOR)
    tags = db.Column(ARRAY(db.String))
    embedding = db.Column(Vector(384)) 
    predicted_rating = db.Column(db.Float)

    criteria = db.relationship("Criteria", back_populates="document")

class Institute(db.Model):
    __tablename__ = 'institute'

    instID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.String(10), db.ForeignKey('employee.employeeID'))
    instCode = db.Column(db.String(50), nullable=False)
    instName = db.Column(db.String(100), nullable=False)
    instPic = db.Column(db.Text)

    dean = db.relationship("Employee", backref="institutes", foreign_keys=[employeeID])
    programs = db.relationship("Program", back_populates="institute", cascade="all, delete-orphan")
    areas = db.relationship("Area", back_populates="institute")
    deadlines = db.relationship("Deadline", back_populates="institute")

class Deadline(db.Model):
    __tablename__ = 'deadline'

    deadlineID = db.Column(db.Integer, primary_key=True, nullable=False)
    instID = db.Column(db.Integer, db.ForeignKey('institute.instID'), nullable=True)
    programID = db.Column(db.Integer, nullable=False)
    areaID = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    
    institute = db.relationship("Institute", back_populates="deadlines")

class AuditLog(db.Model):
    __tablename__ = 'audit_log'

    logID = db.Column(db.Integer, primary_key=True, nullable=False)
    employeeID = db.Column(db.String(10), nullable=False)
    action = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime)

class Announcement(db.Model):
    __tablename__ = 'announcement'

    announceID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employeeID = db.Column(db.String(10), db.ForeignKey('employee.employeeID'), nullable=False)
    announceTitle = db.Column(db.String(255))
    announceText = db.Column(db.Text)
    duration = db.Column(db.Date)

# Messaging System Models
class Conversation(db.Model):
    __tablename__ = 'conversation'
    
    conversationID = db.Column(db.Integer, primary_key=True, nullable=False)
    conversationName = db.Column(db.String(100))  # For group chats
    conversationType = db.Column(db.String(20), nullable=False)  # 'direct' or 'group'
    createdBy = db.Column(db.String(50), db.ForeignKey('employee.employeeID'), nullable=False)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    isActive = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship("Employee", backref="created_conversations")
    messages = db.relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    participants = db.relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")

class ConversationParticipant(db.Model):
    __tablename__ = 'conversation_participant'
    
    participantID = db.Column(db.Integer, primary_key=True, nullable=False)
    conversationID = db.Column(db.Integer, db.ForeignKey('conversation.conversationID'), nullable=False)
    employeeID = db.Column(db.String(50), db.ForeignKey('employee.employeeID'), nullable=False)
    joinedAt = db.Column(db.DateTime, default=datetime.utcnow)
    lastReadAt = db.Column(db.DateTime)
    isActive = db.Column(db.Boolean, default=True)
    
    # Relationships
    conversation = db.relationship("Conversation", back_populates="participants")
    employee = db.relationship("Employee", backref="conversation_participations")

class Message(db.Model):
    __tablename__ = 'message'
    
    messageID = db.Column(db.Integer, primary_key=True, nullable=False)
    conversationID = db.Column(db.Integer, db.ForeignKey('conversation.conversationID'), nullable=False)
    senderID = db.Column(db.String(50), db.ForeignKey('employee.employeeID'), nullable=False)
    messageContent = db.Column(db.Text, nullable=False)
    messageType = db.Column(db.String(20), default='text')  # 'text', 'file', 'image'
    sentAt = db.Column(db.DateTime, default=datetime.utcnow)
    editedAt = db.Column(db.DateTime)
    isDeleted = db.Column(db.Boolean, default=False)
    
    # Relationships
    conversation = db.relationship("Conversation", back_populates="messages")
    sender = db.relationship("Employee", backref="sent_messages")


class MessageDeletion(db.Model):
    __tablename__ = 'message_deletion'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    messageID = db.Column(db.Integer, db.ForeignKey('message.messageID'), nullable=False)
    employeeID = db.Column(db.String(50), db.ForeignKey('employee.employeeID'), nullable=False)
    deletedAt = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notification'
    
    notificationID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    recipientID = db.Column(db.String(10), db.ForeignKey('employee.employeeID'), nullable=False)
    senderID = db.Column(db.String(10), db.ForeignKey('employee.employeeID'), nullable=True)  # Null for system notifications
    type = db.Column(db.String(50), nullable=False)  # 'message', 'announcement', 'system'
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    isRead = db.Column(db.Boolean, default=False)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    link = db.Column(db.String(255))  # Optional link to related page
    
    # Relationships
    recipient = db.relationship("Employee", foreign_keys=[recipientID], backref="received_notifications")
    sender = db.relationship("Employee", foreign_keys=[senderID], backref="sent_notifications")