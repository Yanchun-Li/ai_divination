from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from ..auth import (
    create_session,
    create_user,
    get_user_by_email,
    get_user_password_hash,
    get_user_by_session,
    hash_password,
    update_user_birth_date,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    birthDate: str | None = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class ProfilePayload(BaseModel):
    birthDate: str | None = None


@router.post("/register")
def register(payload: RegisterPayload, response: Response):
    email = payload.email.lower().strip()
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="Email already exists")

    password_hash = hash_password(payload.password)
    user = create_user(email, password_hash, payload.birthDate)
    session = create_session(user["id"])

    response.set_cookie(
        "session",
        session["token"],
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return {"user": {"id": user["id"], "email": user["email"], "birthDate": user["birth_date"]}}


@router.post("/login")
def login(payload: LoginPayload, response: Response):
    email = payload.email.lower().strip()
    password_hash = get_user_password_hash(email)
    user = get_user_by_email(email)
    if not user or not password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session = create_session(user["id"])
    response.set_cookie(
        "session",
        session["token"],
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return {"user": {"id": user["id"], "email": user["email"], "birthDate": user["birth_date"]}}


@router.get("/me")
def me(request: Request):
    token = request.cookies.get("session")
    if not token:
        return {"user": None}

    user = get_user_by_session(token)
    if not user:
        return {"user": None}
    return {"user": {"id": user["id"], "email": user["email"], "birthDate": user["birth_date"]}}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("session")
    if token:
        from ..auth import delete_session

        delete_session(token)
    response.delete_cookie("session", path="/")
    return {"ok": True}


@router.patch("/profile")
def update_profile(payload: ProfilePayload, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = get_user_by_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    update_user_birth_date(user["id"], payload.birthDate)
    return {"ok": True}
