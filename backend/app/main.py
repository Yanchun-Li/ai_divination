from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import init_db
from .routers import admin, auth, divination_v2, horoscope, preload


def create_app() -> FastAPI:
    init_db()
    app = FastAPI(title="AI Divination Backend", version="0.1.0")

    # Allow multiple origins for CORS
    allowed_origins = [
        settings.frontend_origin,
        "https://ai-divination.ai-builders.space",
        "https://softcertainty.ai-builders.space",
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
        # 挂载静态资源到 /_next 路径（Next.js 的静态资源）
        next_static = static_dir / "_next"
        if next_static.exists():
            app.mount("/_next", StaticFiles(directory=str(next_static)), name="next_static")

        # 处理 SPA 路由：返回 index.html 给非 API 请求
        @app.get("/{full_path:path}")
        async def serve_spa(request: Request, full_path: str) -> Response:
            # 尝试返回静态文件
            file_path = static_dir / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            # 否则返回 index.html（SPA fallback）
            index_path = static_dir / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
            return Response(content="Not Found", status_code=404)

    return app


app = create_app()
