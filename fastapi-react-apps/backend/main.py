from fastapi import FastAPI
from .routers import apps
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Application Management API")
# execute the following command to run
# uvicorn backend.main:app --reload
app.include_router(apps.router)
