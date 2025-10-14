from fastapi import APIRouter, HTTPException
from .. import models, schemas, database
from typing import List

router = APIRouter()
db = database.SessionLocal()

@router.get("/apps", response_model=List[schemas.Application])
def list_apps():
    return db.query(models.Application).all()

@router.post("/apps", response_model=schemas.Application)
def create_app(app: schemas.ApplicationCreate):
    db_app = models.Application(**app.dict())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.put("/apps/{appcode}", response_model=schemas.Application)
def update_app(appcode: str, app: schemas.ApplicationUpdate):
    db_app = db.query(models.Application).filter(models.Application.appcode == appcode).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="App not found")
    for k, v in app.dict().items():
        setattr(db_app, k, v)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.delete("/apps/{appcode}")
def delete_app(appcode: str):
    db_app = db.query(models.Application).filter(models.Application.appcode == appcode).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="App not found")
    db.delete(db_app)
    db.commit()
    return {"detail": "Deleted"}

@router.get("/environments")
def get_environments():
    return ["dev", "qa", "prod"]

@router.get("/apps/{appcode}/namespaces")
def get_namespaces(appcode: str):
    return [
        {"name": "ns1", "egressname": "eg1", "clusters": "clusterA", "vaultsetup": True, "managedbyargo": False},
        {"name": "ns2", "egressname": "eg2", "clusters": "clusterB", "vaultsetup": False, "managedbyargo": True},
    ]
