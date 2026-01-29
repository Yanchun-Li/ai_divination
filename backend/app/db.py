import json
import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "app.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            birth_date TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS divination_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT NULL,
            question TEXT NOT NULL,
            mode TEXT NOT NULL,
            method TEXT NOT NULL,
            raw_result TEXT NOT NULL,
            interpretation TEXT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
    )
    conn.commit()
    conn.close()


def _serialize_payload(value: object | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value)


def create_divination_record(
    *,
    user_id: int,
    session_id: str | None,
    question: str,
    mode: str,
    method: str,
    raw_result: object,
    interpretation: object | None,
) -> dict:
    created_at = datetime.utcnow().isoformat()
    raw_payload = _serialize_payload(raw_result)
    interpretation_payload = _serialize_payload(interpretation)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO divination_records
            (user_id, session_id, question, mode, method, raw_result, interpretation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            session_id,
            question,
            mode,
            method,
            raw_payload,
            interpretation_payload,
            created_at,
        ),
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return {
        "id": record_id,
        "user_id": user_id,
        "session_id": session_id,
        "question": question,
        "mode": mode,
        "method": method,
        "raw_result": raw_payload,
        "interpretation": interpretation_payload,
        "created_at": created_at,
    }


def get_divination_records_by_user(user_id: int, limit: int = 20) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, question, mode, method, raw_result, interpretation, created_at
        FROM divination_records
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (user_id, limit),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
