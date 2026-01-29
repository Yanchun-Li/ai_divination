from fastapi import APIRouter, HTTPException

from ..config import settings
from ..db import get_connection

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def list_users():
    if not settings.allow_debug_users:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_connection()
    rows = conn.execute("SELECT id, email, birth_date, created_at FROM users ORDER BY id DESC").fetchall()
    conn.close()
    return {"users": [dict(row) for row in rows]}
