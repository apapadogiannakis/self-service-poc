from pydantic import BaseModel
from typing import List, Optional

class ApplicationBase(BaseModel):
    appname: str
    description: Optional[str] = None
    managergroups: List[str]
    environment: str

class ApplicationCreate(ApplicationBase):
    appcode: str

class ApplicationUpdate(ApplicationBase):
    pass

class Application(ApplicationCreate):
    class Config:
        orm_mode = True
