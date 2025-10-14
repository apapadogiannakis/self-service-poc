from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.sqlite import JSON
from .database import Base

class Application(Base):
    __tablename__ = "applications"
    appcode = Column(String, primary_key=True, index=True)
    appname = Column(String, nullable=False)
    description = Column(Text)
    managergroups = Column(JSON)
    environment = Column(String, nullable=False)
