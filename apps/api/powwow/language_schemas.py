"""Versioned language-buddy input and validated model-output contracts."""
from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, field_validator, model_validator

from .language_catalog import LANGUAGE_BY_CODE, LEVEL_IDS
from .schemas import RunOut, Schema


class LanguageProfileCreate(Schema):
    learner_name: str = Field(min_length=1, max_length=100)
    target_language: str = Field(min_length=2, max_length=10)
    native_language: str = Field(default="en", min_length=2, max_length=10)
    level: str = "beginner"
    timezone: str = Field(default="UTC", min_length=1, max_length=100)

    @field_validator("learner_name")
    @classmethod
    def clean_name(cls, value):
        if not value.strip():
            raise ValueError("Enter a learner name.")
        return value.strip()

    @field_validator("target_language", "native_language")
    @classmethod
    def supported_language(cls, value):
        if value not in LANGUAGE_BY_CODE:
            raise ValueError("Choose a language from the catalog.")
        return value

    @field_validator("level")
    @classmethod
    def supported_level(cls, value):
        if value not in LEVEL_IDS:
            raise ValueError("Choose a starting level from the catalog.")
        return value

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError("Use a valid IANA timezone, such as America/New_York.") from exc
        return value

    @model_validator(mode="after")
    def different_languages(self):
        if self.target_language == self.native_language:
            raise ValueError("Choose different learning and fluent languages.")
        return self


class LanguageProfileOut(LanguageProfileCreate):
    id: str
    project_id: str
    start_date: str
    created_at: datetime
    updated_at: datetime


class LanguageDayOut(Schema):
    id: str
    profile_id: str
    date: str
    day_number: int
    chat_id: str


class LanguageDaysOut(Schema):
    profile: LanguageProfileOut
    days: list[LanguageDayOut]
    current_day_id: str | None


class LanguageSegment(Schema):
    # Whitespace belongs around a lexical chunk, never inside a multiword
    # sentence. Scripts without spaces retain their natural lexical segments.
    text: str = Field(min_length=1, max_length=500, pattern=r"^[ \t\r\n]*[^ \t\r\n]*[ \t\r\n]*$")
    translation: str = Field(max_length=500)


class LanguageSuggestion(Schema):
    text: str = Field(min_length=1, max_length=500)
    translation: str = Field(min_length=1, max_length=500)


class LanguageVocabulary(LanguageSuggestion):
    note: str = Field(default="", max_length=500)


class LanguageCorrection(Schema):
    original: str = Field(min_length=1, max_length=1000)
    corrected: str = Field(min_length=1, max_length=1000)
    explanation: str = Field(min_length=1, max_length=1000)


class LanguageContent(Schema):
    text: str = Field(min_length=1, max_length=6000)
    translation: str = Field(min_length=1, max_length=6000)
    explanation: str | None = Field(default=None, max_length=1500)
    correction: LanguageCorrection | None = None
    show_translation_tip: bool = False
    suggested_replies: list[LanguageSuggestion] = Field(default_factory=list, max_length=4)
    vocabulary: list[LanguageVocabulary] = Field(default_factory=list, max_length=8)
    topic: str | None = Field(default=None, max_length=150)


class LanguageReply(LanguageContent):
    segments: list[LanguageSegment] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def faithful_segments(self):
        if not self.text.strip() or not self.translation.strip():
            raise ValueError("Both the conversational response and its translation are required.")
        if "".join(segment.text for segment in self.segments) != self.text:
            raise ValueError("Segments must reproduce the response exactly, including punctuation and spaces.")
        if any(any(char.isalnum() for char in segment.text) and not segment.translation.strip() for segment in self.segments):
            raise ValueError("Every word needs a contextual translation.")
        return self


class LanguageTurnCreate(Schema):
    intelligence: Literal["basic", "smarter", "advanced"] = "basic"
    text: str = Field(default="", max_length=6000)
    action: Literal["reply", "start", "topic", "help"] = "reply"
    idempotency_key: str = Field(min_length=8, max_length=200)
    budget_usd: float = Field(default=1, ge=0, le=100)

    @model_validator(mode="after")
    def require_reply(self):
        self.text = self.text.strip()
        if self.action == "reply" and not self.text:
            raise ValueError("Write or dictate a reply first.")
        return self


class LanguageTurnOut(Schema):
    id: str
    role: Literal["user", "assistant"]
    text: str
    reply: LanguageReply | None = None
    run_id: str | None = None
    created_at: datetime


class LanguageDayDetail(Schema):
    day: LanguageDayOut
    turns: list[LanguageTurnOut]
    active_run: RunOut | None
    last_run: RunOut | None


class LanguagePhraseCreate(Schema):
    text: str = Field(min_length=1, max_length=1000)
    translation: str = Field(min_length=1, max_length=1000)
    note: str = Field(default="", max_length=1500)
    source_turn_id: str | None = None

    @field_validator("text", "translation")
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError("A phrase and its meaning are required.")
        return value.strip()


class LanguagePhraseOut(LanguagePhraseCreate):
    id: str
    profile_id: str
    due_at: datetime
    review_count: int
    interval_days: int
    last_reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LanguagePhraseReview(Schema):
    rating: Literal["again", "good"]
