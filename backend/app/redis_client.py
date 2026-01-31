from redis import Redis

from .config import settings


_redis_client: Redis | None = None
_redis_available: bool | None = None


def get_redis() -> Redis | None:
    """Get Redis client. Returns None if Redis is not available."""
    global _redis_client, _redis_available

    if _redis_available is False:
        return None

    if _redis_client is None:
        try:
            _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
            # Test connection
            _redis_client.ping()
            _redis_available = True
        except Exception:
            _redis_available = False
            _redis_client = None
            return None

    return _redis_client


def is_redis_available() -> bool:
    """Check if Redis is available."""
    get_redis()  # This will set _redis_available
    return _redis_available or False
