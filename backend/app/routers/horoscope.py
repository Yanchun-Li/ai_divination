import json

from fastapi import APIRouter, HTTPException
import httpx

from ..config import settings
from ..horoscope import (
    allowed_days,
    allowed_signs,
    apply_translated_fields,
    generate_horoscope,
    get_cache_key,
    get_horoscope_fields,
    get_target_date,
)
from ..redis_client import get_redis
from ..translate import translate_texts

router = APIRouter(prefix="/api", tags=["horoscope"])

EXTERNAL_HOROSCOPE_BASE = "https://ohmanda.com/api/horoscope"
CACHE_TTL = 60 * 60 * 24


@router.post("/aztro")
async def aztro(payload: dict):
    sign = str(payload.get("sign", "")).lower()
    day = str(payload.get("day", "today")).lower()
    lang = str(payload.get("lang", "en")).lower()

    if sign not in allowed_signs or day not in allowed_days or lang not in {"en", "zh", "ja"}:
        raise HTTPException(status_code=400, detail="Invalid parameters")

    target_date = get_target_date(day)
    cache_key = get_cache_key(lang, sign, target_date)
    redis = get_redis()

    # Try cache first if Redis is available
    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    horoscope = generate_horoscope(sign, day)

    if day == "today":
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{EXTERNAL_HOROSCOPE_BASE}/{sign}")
            if response.status_code == 200:
                external = response.json()
                if external.get("horoscope"):
                    horoscope["current_date"] = external.get("date") or horoscope["current_date"]
                    horoscope["description"] = external["horoscope"]
        except Exception:
            pass

    if lang != "en":
        translated, used = await translate_texts(get_horoscope_fields(horoscope), lang)
        if used:
            horoscope = apply_translated_fields(horoscope, translated)

    # Cache if Redis is available
    if redis:
        try:
            redis.set(cache_key, json.dumps(horoscope), ex=CACHE_TTL)
        except Exception:
            pass

    return horoscope
