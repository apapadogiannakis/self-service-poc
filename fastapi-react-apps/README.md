# FastAPI + React Application Manager

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

API endpoints:
- `GET /apps`
- `POST /apps`
- `PUT /apps/{appcode}`
- `DELETE /apps/{appcode}`
- `GET /environments`
- `GET /apps/{appcode}/namespaces`

## Frontend

```bash
cd frontend
npm install
npm start
```

React app runs at `http://localhost:3000/`
