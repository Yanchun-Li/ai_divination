import json
import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "app.db"

print(f"[DB] BASE_DIR: {BASE_DIR}")
print(f"[DB] DATA_DIR: {DATA_DIR}")
print(f"[DB] DB_PATH: {DB_PATH}")


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

        CREATE TABLE IF NOT EXISTS divination_sessions_v2 (
            id TEXT PRIMARY KEY,
            user_id INTEGER NULL,
            question TEXT NOT NULL,
            mode TEXT NOT NULL,
            method TEXT NOT NULL,
            seed TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            result TEXT NULL,
            interpretation TEXT NULL,
            manual_steps TEXT NULL,
            lang TEXT NOT NULL DEFAULT 'zh',
            created_at TEXT NOT NULL,
            completed_at TEXT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """
    )
    conn.commit()
    
    # 迁移：为旧表添加 lang 列（如果不存在）
    try:
        cursor.execute("ALTER TABLE divination_sessions_v2 ADD COLUMN lang TEXT NOT NULL DEFAULT 'zh'")
        conn.commit()
    except Exception:
        # 列已存在，忽略
        pass
    
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


# ===== V2 Session Functions =====


def create_divination_session_v2(
    *,
    session_id: str,
    user_id: int | None,
    question: str,
    mode: str,
    method: str,
    seed: str,
    lang: str = "zh",
) -> dict:
    """Create a new v2 divination session."""
    created_at = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO divination_sessions_v2
            (id, user_id, question, mode, method, seed, lang, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        """,
        (session_id, user_id, question, mode, method, seed, lang, created_at),
    )
    conn.commit()
    conn.close()
    return {
        "id": session_id,
        "user_id": user_id,
        "question": question,
        "mode": mode,
        "method": method,
        "seed": seed,
        "lang": lang,
        "status": "pending",
        "created_at": created_at,
    }


def get_divination_session_v2(session_id: str) -> dict | None:
    """Get a v2 divination session by ID."""
    conn = get_connection()
    row = conn.execute(
        """
        SELECT id, user_id, question, mode, method, seed, lang, status,
               result, interpretation, manual_steps, created_at, completed_at
        FROM divination_sessions_v2
        WHERE id = ?
        """,
        (session_id,),
    ).fetchone()
    conn.close()
    if row is None:
        return None
    result = dict(row)
    # Parse JSON fields
    for field in ("result", "interpretation", "manual_steps"):
        if result[field]:
            try:
                result[field] = json.loads(result[field])
            except json.JSONDecodeError:
                pass
    return result


def update_divination_session_v2(
    session_id: str,
    *,
    status: str | None = None,
    result: object | None = None,
    interpretation: object | None = None,
    manual_steps: object | None = None,
    completed_at: str | None = None,
) -> bool:
    """Update a v2 divination session."""
    updates = []
    values = []

    if status is not None:
        updates.append("status = ?")
        values.append(status)
    if result is not None:
        updates.append("result = ?")
        values.append(_serialize_payload(result))
    if interpretation is not None:
        updates.append("interpretation = ?")
        values.append(_serialize_payload(interpretation))
    if manual_steps is not None:
        updates.append("manual_steps = ?")
        values.append(_serialize_payload(manual_steps))
    if completed_at is not None:
        updates.append("completed_at = ?")
        values.append(completed_at)

    if not updates:
        return False

    values.append(session_id)
    sql = f"UPDATE divination_sessions_v2 SET {', '.join(updates)} WHERE id = ?"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def get_divination_sessions_by_user_v2(user_id: int, limit: int = 20) -> list[dict]:
    """Get v2 divination sessions for a user."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, question, mode, method, status, created_at, completed_at
        FROM divination_sessions_v2
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (user_id, limit),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
