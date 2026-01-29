import json

from fastapi import APIRouter, HTTPException, Request

from ..config import settings
from ..horoscope import (
    allowed_signs,
    apply_translated_fields,
    generate_horoscope,
    get_cache_key,
    get_horoscope_fields,
    get_target_date,
)
from ..redis_client import get_redis
from ..translate import translate_texts

router = APIRouter(prefix="/api", tags=["preload"])

CACHE_TTL = 60 * 60 * 24


@router.post("/preload")
async def preload(request: Request):
    secret = request.headers.get("x-preload-secret")
    if not settings.preload_secret or secret != settings.preload_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    target_date = get_target_date("today")
    redis = get_redis()
    languages = ["en", "zh", "ja"]
    results = []

    for sign in allowed_signs:
        sign_result = {"sign": sign, "languages": []}
        base = generate_horoscope(sign, "today")

        for lang in languages:
            try:
                horoscope = base
                if lang != "en":
                    translated, used = await translate_texts(get_horoscope_fields(base), lang)
                    if used:
                        horoscope = apply_translated_fields(base, translated)
                cache_key = get_cache_key(lang, sign, target_date)
                redis.set(cache_key, json.dumps(horoscope), ex=CACHE_TTL)
                sign_result["languages"].append({"lang": lang, "success": True})
            except Exception as exc:
                sign_result["languages"].append({"lang": lang, "success": False, "error": str(exc)})

        results.append(sign_result)

    return {
        "message": "Preload completed",
        "date": target_date.strftime("%Y-%m-%d"),
        "results": results,
    }


@router.get("/preload")
def preload_health():
    return {
        "status": "ok",
        "endpoint": "/api/preload",
        "method": "POST",
        "required_header": "x-preload-secret",
    }
