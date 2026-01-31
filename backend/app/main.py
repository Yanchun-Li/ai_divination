from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import init_db
from .routers import admin, auth, divination, divination_v2, horoscope, preload


def create_app() -> FastAPI:
    init_db()
    app = FastAPI(title="AI Divination Backend", version="0.1.0")

    # Allow multiple origins for CORS
    allowed_origins = [
        settings.frontend_origin,
        "https://ai-divination.ai-builders.space",
        "http://localhost:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(horoscope.router)
    app.include_router(divination.router)
    app.include_router(divination_v2.router)
    app.include_router(preload.router)
    app.include_router(admin.router)

    @app.get("/health")
    def health():
        # Simple health check - don't call Redis here to avoid startup delay
        return {"status": "ok"}

    # 部署时：Docker 会把 Next.js 静态产物放到 app/static，挂载到 / 供前端访问
    static_dir = Path(__file__).resolve().parent / "static"
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app


app = create_app()
