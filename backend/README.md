# HotRide Backend

FastAPI backend for HotRide mobile app authentication system.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables in `.env` file

4. Start MongoDB (local or use MongoDB Atlas)

5. Run the server:
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

- POST /api/auth/login - Email/Phone + Password authentication
- POST /api/auth/google - Google OAuth authentication
- POST /api/auth/apple - Apple Sign In authentication
