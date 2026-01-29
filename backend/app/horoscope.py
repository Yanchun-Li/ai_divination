from __future__ import annotations

from datetime import datetime, timedelta


sign_data: dict[str, dict[str, object]] = {
    "aries": {"date_range": "Mar 21 - Apr 19", "element": "fire", "compatible": ["leo", "sagittarius", "gemini", "aquarius"]},
    "taurus": {"date_range": "Apr 20 - May 20", "element": "earth", "compatible": ["virgo", "capricorn", "cancer", "pisces"]},
    "gemini": {"date_range": "May 21 - Jun 20", "element": "air", "compatible": ["libra", "aquarius", "aries", "leo"]},
    "cancer": {"date_range": "Jun 21 - Jul 22", "element": "water", "compatible": ["scorpio", "pisces", "taurus", "virgo"]},
    "leo": {"date_range": "Jul 23 - Aug 22", "element": "fire", "compatible": ["aries", "sagittarius", "gemini", "libra"]},
    "virgo": {"date_range": "Aug 23 - Sep 22", "element": "earth", "compatible": ["taurus", "capricorn", "cancer", "scorpio"]},
    "libra": {"date_range": "Sep 23 - Oct 22", "element": "air", "compatible": ["gemini", "aquarius", "leo", "sagittarius"]},
    "scorpio": {"date_range": "Oct 23 - Nov 21", "element": "water", "compatible": ["cancer", "pisces", "virgo", "capricorn"]},
    "sagittarius": {"date_range": "Nov 22 - Dec 21", "element": "fire", "compatible": ["aries", "leo", "libra", "aquarius"]},
    "capricorn": {"date_range": "Dec 22 - Jan 19", "element": "earth", "compatible": ["taurus", "virgo", "scorpio", "pisces"]},
    "aquarius": {"date_range": "Jan 20 - Feb 18", "element": "air", "compatible": ["gemini", "libra", "aries", "sagittarius"]},
    "pisces": {"date_range": "Feb 19 - Mar 20", "element": "water", "compatible": ["cancer", "scorpio", "taurus", "capricorn"]},
}

descriptions = [
    "Today is a day for reflection and inner growth. Take time to listen to your intuition, as it will guide you toward meaningful decisions. Small acts of kindness will bring unexpected rewards.",
    "The stars align to bring you clarity and focus. This is an excellent time to pursue your goals with renewed energy. Trust in your abilities and don't be afraid to take the lead.",
    "A sense of calm washes over you today. Use this peaceful energy to connect with loved ones and strengthen important relationships. Your empathy will be your greatest strength.",
    "Creative inspiration flows freely today. Whether in work or personal projects, your innovative ideas will shine. Don't hesitate to share your vision with others.",
    "Today brings opportunities for personal transformation. Embrace change with an open heart, and you'll discover new aspects of yourself. The universe supports your growth.",
    "Your determination is especially strong today. Focus on long-term goals and take practical steps toward achieving them. Patience and persistence will be rewarded.",
    "Social connections take center stage today. Reach out to friends or colleagues you haven't spoken to in a while. A chance encounter may lead to exciting opportunities.",
    "Today invites you to slow down and appreciate life's simple pleasures. Take a moment to enjoy nature, art, or a good conversation. Balance is key to your wellbeing.",
    "Your analytical skills are heightened today. This is an ideal time for problem-solving and making important decisions. Trust your logical mind to guide you.",
    "Adventure calls to you today. Whether it's trying something new or exploring unfamiliar territory, embrace the spirit of discovery. Your courage will be rewarded.",
    "Today emphasizes harmony and cooperation. Working with others will lead to better outcomes than going it alone. Listen as much as you speak, and compromise when needed.",
    "A wave of motivation carries you forward today. Channel this energy into productive activities and you'll accomplish more than you expected. Stay focused on what matters most.",
]

moods = [
    "Optimistic",
    "Reflective",
    "Energetic",
    "Peaceful",
    "Curious",
    "Determined",
    "Inspired",
    "Balanced",
    "Adventurous",
    "Thoughtful",
    "Confident",
    "Serene",
    "Playful",
    "Focused",
    "Harmonious",
]

colors = [
    "Royal Blue",
    "Emerald Green",
    "Golden Yellow",
    "Rose Pink",
    "Deep Purple",
    "Ocean Teal",
    "Sunset Orange",
    "Silver Gray",
    "Coral Red",
    "Lavender",
    "Mint Green",
    "Sky Blue",
    "Burgundy",
    "Cream White",
    "Forest Green",
]

lucky_times = [
    "7am",
    "8am",
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
    "7pm",
    "8pm",
    "9pm",
    "10pm",
]

allowed_signs = set(sign_data.keys())
allowed_days = {"today", "tomorrow", "yesterday"}


def simple_hash(value: str) -> int:
    hash_value = 0
    for char in value:
        hash_value = (hash_value << 5) - hash_value + ord(char)
        hash_value &= hash_value
    return abs(hash_value)


def seeded_random(seed: int, index: int) -> float:
    from math import sin, floor

    value = sin(seed + index * 9999) * 10000
    return value - floor(value)


def pick_from_array(items: list[str], seed: int, offset: int) -> str:
    idx = int(seeded_random(seed, offset) * len(items))
    return items[idx]


def generate_lucky_number(seed: int) -> str:
    return str(int(seeded_random(seed, 100) * 99) + 1)


def get_target_date(day: str) -> datetime:
    now = datetime.utcnow()
    if day == "tomorrow":
        return now + timedelta(days=1)
    if day == "yesterday":
        return now - timedelta(days=1)
    return now


def format_date(date: datetime) -> str:
    months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return f"{months[date.month - 1]} {date.day}, {date.year}"


def generate_horoscope(sign: str, day: str) -> dict[str, str]:
    target_date = get_target_date(day)
    date_key = f"{target_date.year}-{target_date.month}-{target_date.day}"
    seed = simple_hash(f"{sign}-{date_key}")

    data = sign_data[sign]
    compatible = pick_from_array(data["compatible"], seed, 1)
    compatible_label = compatible.capitalize()

    return {
        "current_date": format_date(target_date),
        "compatibility": compatible_label,
        "lucky_time": pick_from_array(lucky_times, seed, 2),
        "lucky_number": generate_lucky_number(seed),
        "color": pick_from_array(colors, seed, 4),
        "date_range": data["date_range"],
        "mood": pick_from_array(moods, seed, 5),
        "description": pick_from_array(descriptions, seed, 6),
    }


def get_cache_key(lang: str, sign: str, date: datetime) -> str:
    return f"horoscope:{lang}:{sign}:{date.year}-{date.month}-{date.day}"


def get_horoscope_fields(horoscope: dict[str, str]) -> list[str]:
    return [
        horoscope["current_date"],
        horoscope["compatibility"],
        horoscope["lucky_time"],
        horoscope["color"],
        horoscope["date_range"],
        horoscope["mood"],
        horoscope["description"],
    ]


def apply_translated_fields(horoscope: dict[str, str], translated: list[str]) -> dict[str, str]:
    return {
        **horoscope,
        "current_date": translated[0],
        "compatibility": translated[1],
        "lucky_time": translated[2],
        "color": translated[3],
        "date_range": translated[4],
        "mood": translated[5],
        "description": translated[6],
    }
