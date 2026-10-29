"""Selectable teaching languages and practical, self-selected starting levels."""

LANGUAGES = [
    {"code": code, "name": name, "native_name": native, "locale": locale}
    for code, name, native, locale in [
        ("en", "English", "English", "en-US"), ("es", "Spanish", "Español", "es-ES"),
        ("fr", "French", "Français", "fr-FR"), ("de", "German", "Deutsch", "de-DE"),
        ("it", "Italian", "Italiano", "it-IT"), ("pt", "Portuguese", "Português", "pt-BR"),
        ("ja", "Japanese", "日本語", "ja-JP"), ("ko", "Korean", "한국어", "ko-KR"),
        ("zh", "Mandarin Chinese", "中文", "zh-CN"), ("ar", "Arabic", "العربية", "ar-SA"),
        ("hi", "Hindi", "हिन्दी", "hi-IN"), ("ru", "Russian", "Русский", "ru-RU"),
        ("uk", "Ukrainian", "Українська", "uk-UA"), ("nl", "Dutch", "Nederlands", "nl-NL"),
        ("sv", "Swedish", "Svenska", "sv-SE"), ("pl", "Polish", "Polski", "pl-PL"),
        ("tr", "Turkish", "Türkçe", "tr-TR"), ("vi", "Vietnamese", "Tiếng Việt", "vi-VN"),
        ("el", "Greek", "Ελληνικά", "el-GR"), ("he", "Hebrew", "עברית", "he-IL"),
    ]
]
LANGUAGE_BY_CODE = {item["code"]: item for item in LANGUAGES}
LEVELS = [
    {"id": "beginner", "name": "Just starting", "description": "Simple greetings, everyday words, and plenty of support."},
    {"id": "elementary", "name": "I know a little", "description": "Short exchanges about familiar people and daily life."},
    {"id": "intermediate", "name": "Keep me talking", "description": "Everyday conversations, stories, and gentle corrections."},
    {"id": "advanced", "name": "Challenge me", "description": "Nuance, longer ideas, and natural expressions."},
]
LEVEL_IDS = {item["id"] for item in LEVELS}
