from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

from passlib.context import CryptContext

from .config import settings
from .db import get_connection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def get_user_by_email(email: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT id, email, birth_date, created_at FROM users WHERE email = ? LIMIT 1",
        (email,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_password_hash(email: str) -> str | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT password_hash FROM users WHERE email = ? LIMIT 1",
        (email,),
    ).fetchone()
    conn.close()
    return row["password_hash"] if row else None


def create_user(email: str, password_hash: str, birth_date: str | None) -> dict:
    created_at = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (email, password_hash, birth_date, created_at) VALUES (?, ?, ?, ?)",
        (email, password_hash, birth_date, created_at),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return {"id": user_id, "email": email, "birth_date": birth_date, "created_at": created_at}


def update_user_birth_date(user_id: int, birth_date: str | None) -> None:
    conn = get_connection()
    conn.execute(
        "UPDATE users SET birth_date = ? WHERE id = ?",
        (birth_date, user_id),
    )
    conn.commit()
    conn.close()


def create_session(user_id: int) -> dict:
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(days=settings.session_ttl_days)
    token = uuid4().hex

    conn = get_connection()
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, user_id, created_at.isoformat(), expires_at.isoformat()),
    )
    conn.commit()
    conn.close()
    return {
        "token": token,
        "user_id": user_id,
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat(),
    }


def get_user_by_session(token: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        """
        SELECT u.id, u.email, u.birth_date, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?
        LIMIT 1
        """,
        (token, datetime.utcnow().isoformat()),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_session(token: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()
