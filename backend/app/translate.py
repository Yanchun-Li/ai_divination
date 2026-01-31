import json
import logging

import httpx

from .config import settings

logger = logging.getLogger(__name__)


async def translate_texts(texts: list[str], target: str) -> tuple[list[str], bool]:
    if target == "en":
        logger.info("[TRANSLATE] Target is English, skipping translation")
        return texts, False
    if not settings.ai_builder_api_key:
        logger.warning("[TRANSLATE] AI_BUILDER_TOKEN/API_KEY not configured, skipping translation")
        return texts, False
    
    logger.info(f"[TRANSLATE] Translating to {target}, API key present: {bool(settings.ai_builder_api_key)}")

    prompt = "\n".join(
        [
            "Translate the following JSON array into the target language.",
            "Return ONLY a JSON array of strings in the same order.",
            f"Target language: {target}",
        ]
    )

    payload = {
        "model": settings.ai_builder_model,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(texts)},
        ],
        "temperature": 0.2,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                settings.ai_builder_api_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.ai_builder_api_key}",
                },
                json=payload,
            )
            if response.status_code >= 400:
                logger.error(f"[TRANSLATE] API failed: {response.status_code} {response.text}")
                return texts, False
            data = response.json()

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        translated = json.loads(content)
        if not isinstance(translated, list) or len(translated) != len(texts):
            logger.error(f"[TRANSLATE] Unexpected format: {content[:200]}")
            return texts, False
        
        logger.info(f"[TRANSLATE] Success! Translated {len(translated)} fields to {target}")
        return translated, True
    except Exception as e:
        logger.error(f"[TRANSLATE] Exception: {e}")
        return texts, False
