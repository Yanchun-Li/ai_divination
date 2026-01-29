import json

import httpx

from .config import settings


async def translate_texts(texts: list[str], target: str) -> tuple[list[str], bool]:
    if target == "en":
        return texts, False
    if not settings.ai_builder_api_key:
        return texts, False

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
            raise RuntimeError(f"Translation API failed: {response.status_code} {response.text}")
        data = response.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    translated = json.loads(content)
    if not isinstance(translated, list) or len(translated) != len(texts):
        raise RuntimeError("Translation API returned unexpected format")
    return translated, True
