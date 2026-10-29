"""Deterministic planning foundation. No provider calls or implicit paid work."""
import re
from copy import deepcopy

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .builder_catalog import COMPONENT_IDS, KIND_BY_ID
from .builder_schemas import BuilderWorkspace, PlanRequest
from .project_details import consolidate_details
from .language_catalog import LANGUAGES
from .db import now
from .models import Chat, Message, Project, ProjectWorkspace


KIND_PATTERNS = {
    "game": r"games?|platformer|rpg|side[- ]?scroller",
    "movie": r"movies?|films?|animated series|tv series|screenplay",
    "book": r"books?|novels?|novellas?|short stor(?:y|ies)",
    "comic": r"comics?|webtoon|graphic novel|manga",
    "website": r"websites?|web sites?|landing page|portfolio site|online store",
    "app": r"apps?|application|dashboard|software|web tool",
    "podcast": r"podcasts?|audio drama",
    "music": r"songs?|music|album|soundtrack|instrumental",
    "course": r"courses?|curriculum|lesson series|workshop|tutorial series",
    "brand": r"brand(?:ing)?|brand identity|visual identity",
    "research": r"research (?:project|report|study)|research|study|literature review",
}
CREATE = re.compile(r"\b(?:build|create|make|develop|write|design|start|plan|produce|launch|publish|making|building|creating|writing)\b", re.I)
LANGUAGE_NAMES = "|".join(re.escape(item["name"]) for item in LANGUAGES) + "|Chinese|Mandarin"
LEARN = re.compile(r"\b(?:learn|practice|practise|improve|learning|practicing)\s+(?:my\s+)?(?:" + LANGUAGE_NAMES + r")\b", re.I)


def detect_kind(prompt: str) -> str | None:
    # Prefer the first project noun after the creation verb. 'An app for books'
    # should be an app, and 'an image of a game' should remain a media request.
    action = CREATE.search(prompt)
    if not action:
        learner = LEARN.search(prompt)
        if learner and not re.search(r"\b(?:don't|do not|not to|never|cannot)\s+(?:want to\s+)?$", prompt[max(0, learner.start() - 30):learner.start()], re.I):
            return "language"
        return None
    before = prompt[max(0, action.start() - 30):action.start()].lower()
    if re.search(r"(?:don't|do not|not to|never)\s+(?:want to\s+)?$", before):
        return None
    if re.search(r"\b(?:explain|tell me (?:about|how)|what (?:is|are)|how (?:does|do)|tutorial (?:on|about)|example of)\b", prompt[:action.start()], re.I):
        return None
    tail = prompt[action.end():action.end() + 180]
    candidates = []
    for kind, pattern in KIND_PATTERNS.items():
        match = re.search(r"\b(?:" + pattern + r")\b", tail, re.I)
        if match:
            candidates.append((match.start(), -len(match.group()), kind))
    if not candidates:
        return "language" if LEARN.search(prompt) or re.search(r"\blanguage[- ]learning\b", tail, re.I) else None
    offset, _, kind = min(candidates)
    prefix = tail[:offset]
    # A component request ('make a book cover', 'write a game script') is not
    # permission to configure a whole project, even on a new chat.
    if re.search(r"\b(?:image|picture|photo|illustration|drawing|logo|poster|thumbnail|icon|cover|asset|character|chapter|scene|outline|script|task|button)\b", prefix, re.I):
        return None
    noun = re.search(r"\b(?:" + KIND_PATTERNS[kind] + r")\b", tail, re.I)
    suffix = tail[noun.end():noun.end() + 30]
    if re.match(r"\s+(?:cover|poster|logo|thumbnail|icon|asset|character|chapter|scene|outline|script|review|summary|trailer|task|button|recommendations?|ideas?|mockup)\b", suffix, re.I):
        return None
    return kind


# Only explicit language is inferred. Recommended choices remain visible as
# unanswered decisions, rather than being mistaken for a user's preferences.
COMMON_INFERENCE = {
    "experience": {"beginner": r"\b(?:beginner|first time|new to (?:coding|building|this)|never (?:coded|built)|no (?:coding|programming) experience)\b", "experienced": r"\b(?:experienced|professional|expert|senior developer)\b"},
}
GAME_INFERENCE = {
    "dimension": {"2d": r"\b2[- ]?d\b", "3d": r"\b3[- ]?d\b"},
    "perspective": {"side": r"\b(?:side[- ]?(?:scroller|scrolling|view)|platformer)\b", "top": r"\btop[- ]down\b", "isometric": r"\bisometric\b", "first-person": r"\bfirst[- ]person\b", "third-person": r"\bthird[- ]person\b"},
    "engine": {"godot": r"\bgodot\b", "unity": r"\bunity\b", "unreal": r"\bunreal\b", "browser": r"\b(?:html5|javascript|phaser|three\.?js|browser[- ]based)\b"},
    "platform": {"web": r"\b(?:web|browser|html5)\b", "mobile": r"\b(?:mobile|android|ios|iphone|ipad|phone|tablet)\b", "desktop": r"\b(?:desktop|windows|macos|linux|pc)\b", "console": r"\b(?:console|xbox|playstation|nintendo)\b"},
    "play_mode": {"solo": r"\b(?:single[- ]player|solo|one player)\b", "local": r"\b(?:local multiplayer|couch co[- ]?op|same[- ]device)\b", "online": r"\b(?:online multiplayer|online co[- ]?op|mmo)\b"},
}
INFERENCE = {
    "language": {
        "target_language": {item["code"]: r"\b(?:learn|practice|practise|improve|learning|practicing)\s+(?:my\s+)?" + re.escape(item["name"]) + r"\b" for item in LANGUAGES},
        "native_language": {item["code"]: r"\b(?:native|fluent)\s+(?:language\s+is\s+)?" + re.escape(item["name"]) + r"\b|\bI speak\s+" + re.escape(item["name"]) + r"\s+fluently\b" for item in LANGUAGES},
        "level": {"beginner": r"\b(?:beginner|just starting|complete beginner)\b", "elementary": r"\b(?:elementary|know a little)\b", "intermediate": r"\bintermediate\b", "advanced": r"\badvanced\b"},
    },
    "game": GAME_INFERENCE,
    "movie": {
        "format": {"short": r"\bshort (?:film|movie)\b", "feature": r"\bfeature(?:[- ]length)?\b", "series": r"\bseries\b"},
        "style": {"animation": r"\b(?:animated|animation)\b", "cinematic": r"\b(?:cinematic|live[- ]action)\b", "documentary": r"\bdocumentary\b"},
        "duration": {"one-minute": r"\b(?:one|1)[- ]minute\b|\b60[- ]seconds?\b", "five-minutes": r"\b(?:five|5)[- ]minutes?\b"},
        "release_target": {"vertical": r"\b(?:vertical|tiktok|reels)\b|9:16", "landscape": r"\b(?:landscape|widescreen)\b|16:9", "festival": r"\bfestival\b"},
    },
    "book": {
        "format": {"nonfiction": r"\bnon[- ]fiction\b", "children": r"\bchildren'?s?\b|\bpicture book\b", "short-story": r"\bshort stor(?:y|ies)\b", "novel": r"\bnovel\b"},
        "genre": {"fantasy": r"\bfantasy\b", "scifi": r"\b(?:sci[- ]?fi|science fiction)\b", "mystery": r"\b(?:mystery|detective)\b", "realistic": r"\b(?:memoir|biography|realistic|nonfiction)\b"},
        "publishing": {"digital": r"\b(?:ebook|e-book|digital|pdf)\b", "print": r"\b(?:print|paperback|hardcover)\b", "private": r"\b(?:private|just for (?:me|us))\b"},
    },
    "comic": {
        "format": {"webtoon": r"\b(?:webtoon|vertical scroll)\b", "strip": r"\b(?:comic strip|strips)\b"},
        "style": {"manga": r"\bmanga\b", "cartoon": r"\bcartoon\b", "painted": r"\bpainted\b"},
        "color": {"mono": r"\b(?:black and white|monochrome)\b", "color": r"\bfull colou?r\b", "limited": r"\blimited palette\b"},
    },
    "website": {
        "purpose": {"landing": r"\blanding page\b", "portfolio": r"\bportfolio\b", "store": r"\b(?:store|shop|ecommerce|e-commerce)\b", "community": r"\bcommunity\b"},
        "style": {"minimal": r"\b(?:minimal|simple|clean)\b", "playful": r"\bplayful\b", "editorial": r"\beditorial\b"},
        "features": {"accounts": r"\b(?:accounts|login|payments|checkout)\b", "forms": r"\b(?:contact form|forms)\b", "static": r"\bstatic\b"},
    },
    "app": {"platform": GAME_INFERENCE["platform"], "data": {"local": r"\b(?:offline|local[- ]only|on[- ]device)\b", "cloud": r"\b(?:cloud|sync|synced)\b"}, "scope": {"prototype": r"\bprototype\b", "mvp": r"\bmvp\b", "production": r"\b(?:production|launch[- ]ready)\b"}},
    "podcast": {"format": {"interview": r"\binterview\b", "fiction": r"\b(?:fiction|audio drama)\b", "solo": r"\bsolo\b"}, "cadence": {"weekly": r"\bweekly\b", "monthly": r"\bmonthly\b", "pilot": r"\bpilot\b"}, "voice": {"synthetic": r"\b(?:ai narration|ai voice|synthetic voice)\b", "record": r"\bmy (?:own )?voice\b"}},
    "music": {"format": {"soundtrack": r"\bsoundtrack\b", "instrumental": r"\binstrumental\b", "song": r"\bsong\b"}, "mood": {"calm": r"\b(?:calm|relaxing|peaceful)\b", "dramatic": r"\b(?:dramatic|epic|tense)\b", "uplifting": r"\b(?:uplifting|happy|upbeat)\b"}, "vocals": {"none": r"\binstrumental\b|\bno vocals\b", "record": r"\bmy (?:own )?vocals\b", "synthetic": r"\bai vocals\b"}},
    "course": {"audience": {"children": r"\b(?:children|kids)\b", "beginners": r"\bbeginners\b", "advanced": r"\b(?:advanced|experienced learners)\b"}, "format": {"video": r"\bvideo\b", "interactive": r"\binteractive\b", "text": r"\b(?:text|written)\b"}, "length": {"mini": r"\bmini\b", "workshop": r"\bworkshop\b", "series": r"\bseries\b"}},
    "brand": {"purpose": {"business": r"\b(?:business|company)\b", "personal": r"\bpersonal\b", "project": r"\bproject\b"}, "tone": {"friendly": r"\b(?:friendly|warm)\b", "bold": r"\b(?:bold|energetic)\b", "refined": r"\b(?:refined|calm|luxury)\b"}},
    "research": {"goal": {"compare": r"\bcompar(?:e|ison|ing)\b", "test": r"\b(?:hypothesis|experiment|test)\b", "understand": r"\bunderstand\b"}, "depth": {"deep": r"\b(?:deep|detailed|comprehensive)\b", "overview": r"\boverview\b", "ongoing": r"\bongoing\b"}, "deliverable": {"presentation": r"\bpresentation\b", "comparison": r"\bcomparison\b", "report": r"\breport\b"}},
}


def infer_answers(kind: str, prompt: str) -> dict[str, str]:
    result = {}
    available = {q["id"]: {option["id"] for option in q["options"]} for q in KIND_BY_ID[kind]["questions"]}
    for key, choices in {**COMMON_INFERENCE, **INFERENCE.get(kind, {})}.items():
        matches = []
        for answer, pattern in choices.items():
            found = re.search(pattern, prompt, re.I)
            if found and answer in available.get(key, set()):
                # Do not turn a negated or ambiguous preference into a decision.
                prefix = prompt[max(0, found.start() - 24):found.start()]
                if not re.search(r"\b(?:not|no|without|instead of|avoid)\s+(?:using\s+)?$", prefix, re.I):
                    matches.append(answer)
        if len(matches) == 1:
            result[key] = matches[0]
    return result


def owned_project(db: Session, project_id: str, owner: str) -> Project:
    from .collaboration import project_access
    return project_access(db, project_id, owner)


def get_workspace(db: Session, project_id: str) -> dict:
    row = db.get(ProjectWorkspace, project_id)
    if not row:
        return {"version": 0, "workspace": BuilderWorkspace().model_dump()}
    return {"version": row.version, "workspace": experience_components(deepcopy(row.workspace))}


def experience_components(document: dict) -> dict:
    # Retain legacy documents and tasks, but stop presenting universal planning
    # tools in learning and novel experiences. Bring old novel notes into Plot.
    if document.get("kind") in {"language", "book"}:
        legacy_blueprint = "design" in document["components"]
        document["components"] = [item for item in document["components"] if item not in {"design", "tasks"}]
        if document["kind"] == "book" and legacy_blueprint:
            document["components"] = list(dict.fromkeys(["plot", *document["components"]]))
            records = document.setdefault("records", {}).setdefault("plot", [])
            if document.get("design") and not any(item["id"] == "legacy-story-notes" for item in records):
                records.append({"id": "legacy-story-notes", "title": "Story notes", "fields": {"summary": document["design"]}})
    return consolidate_details(document)


def save_workspace(db: Session, project_id: str, version: int, workspace: dict, *, commit: bool = True) -> dict:
    document = experience_components(BuilderWorkspace.model_validate(workspace).model_dump())
    category_ids = {item["id"] for item in document["detail_categories"]}
    if set(document["components"]) - COMPONENT_IDS or set(document["records"]) - (COMPONENT_IDS | category_ids):
        raise HTTPException(422, detail={"code": "invalid_component", "message": "Choose a component from the builder catalog."})
    # Keep writes bounded independently of individual field limits.
    import json
    if len(json.dumps(document).encode("utf-8")) > 2_000_000:
        raise HTTPException(413, detail={"code": "workspace_too_large", "message": "Keep the project workspace below 2 MB. Store large files in the asset library."})
    try:
        if version == 0:
            db.add(ProjectWorkspace(project_id=project_id, workspace=document, version=1))
            db.flush()
        else:
            result = db.execute(update(ProjectWorkspace).where(ProjectWorkspace.project_id == project_id, ProjectWorkspace.version == version).values(workspace=document, version=version + 1, updated_at=now()))
            if result.rowcount != 1:
                db.rollback()
                raise HTTPException(409, detail={"code": "workspace_conflict", "message": "This project changed in another session. Reload the latest workspace before saving."})
        if commit:
            db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, detail={"code": "workspace_conflict", "message": "This project changed in another session. Reload the latest workspace before saving."})
    return {"version": version + 1, "workspace": document}


def preview_plan(db: Session, project: Project, body: PlanRequest, current: dict | None = None) -> dict:
    current = current or get_workspace(db, project.id)
    workspace = current["workspace"]
    inferred_kind = detect_kind(body.prompt)
    kind = body.kind or inferred_kind or workspace["kind"] or "other"
    allowed = {question["id"]: {option["id"] for option in question["options"]} for question in KIND_BY_ID[kind]["questions"]}
    # Preserve saved legacy planning preferences without asking about prices
    # in creative setup. Execution limits are enforced separately by service.
    allowed["budget"] = {"free", "lean", "flexible"}
    # Retain confirmed choices when refining a plan, while preventing a shared
    # key such as 'format' from carrying a book-only option into a movie plan.
    prior_answers = {key: value for key, value in workspace["answers"].items() if value in allowed.get(key, set())}
    answers = {**prior_answers, **infer_answers(kind, body.prompt), **body.answers}
    reason = None
    if project.archived:
        reason = "archived"
    elif not body.explicit:
        if workspace["initialized"]:
            reason = "already_planned"
        elif db.scalar(select(Message.id).join(Chat, Message.chat_id == Chat.id).where(Chat.project_id == project.id, Message.role == "user").limit(1)):
            reason = "existing_conversation"
        elif not inferred_kind:
            reason = "no_creation_intent"
    return {"eligible": reason is None, "reason": reason, "kind": kind, "answers": answers}


# Each step carries a concrete deliverable and acceptance evidence. Shared
# decision, prototype, review, and release phases keep the map useful to novices.
STEPS = {
    "language": [
        ("language", "Set up a learner profile", "Choose your learning language, fluent language, starting level, and timezone. Keep each learner's conversations separate.", "A named learner can open their daily conversation with translations in the correct fluent language."),
        ("language", "Have a short first conversation", "Try an everyday question. Reply by text or supported speech input; use a suggested answer if you get stuck.", "The learner exchanges a few messages and can ask for help without restarting the conversation."),
        ("language", "Try word hints and listening", "Tap unfamiliar words, reveal the complete meaning when needed, and listen with an available device voice.", "The learner understands how to reveal help and can return to practicing independently."),
        ("language", "Save a few useful phrases", "Choose phrases that matter to you. Try recalling their meaning before revealing and rating the answer.", "At least three personally useful phrases are saved with meanings and review dates."),
        ("language", "Return for a new daily conversation", "Use a new topic or continue a recent interest; review phrases that are due.", "Today's conversation opens by default and earlier days remain available to read."),
    ],
    "game": [
        ("game-design", "Describe the core play loop", "Write what the player does, what changes, and how they win or lose.", "The loop can be explained in two sentences and has a clear goal."),
        ("game-design", "Build one playable room", "Implement movement, input, a goal, and a restart using placeholder art.", "A player can start, act, reach an outcome, and restart without help."),
        ("world", "Sketch the first level", "Map the start, challenge, reward, and finish before adding more levels.", "The level teaches one mechanic and can be completed in a short session."),
        ("characters", "Define the player and key characters", "Record appearance, abilities, motivation, and consistent reference notes.", "Each character has one clear gameplay role and a reusable visual description."),
        ("assets", "Replace placeholders with a small asset set", "List sprites or models, effects, and interface art; track provenance and approval.", "Required assets load correctly and their usage rights are recorded."),
        ("audio", "Add feedback and sound cues", "Use a small set of original or licensed effects for actions, success, and failure.", "Actions have clear feedback; sound can be muted and volume controlled."),
        ("game-design", "Playtest the complete loop", "Ask a new player to try without coaching and record where they get stuck.", "A new player understands the goal and completes the loop; major issues become tasks."),
    ],
    "movie": [
        ("plot", "Write the premise and story beats", "Define the main character, goal, conflict, and ending, then order the beats.", "The story has a clear beginning, change, and resolution."),
        ("characters", "Create the character reference bible", "Record consistent appearance, wardrobe, voice, and approved visual references.", "Every recurring character has a reusable identity and reference."),
        ("manuscript", "Draft the scene script", "Write scene action and dialogue around the agreed scope and duration.", "Every scene advances the story and can be estimated for running time."),
        ("storyboard", "Board one complete scene", "Capture each shot's script, camera, first frame, last frame, and transition.", "Shot order is readable and first/last frame references are attached or explicitly pending."),
        ("assets", "Produce and review a sample shot", "Test character and visual consistency before generating the rest of the footage.", "An approved sample establishes motion, framing, style, and production requirements."),
        ("audio", "Prepare dialogue, music, and captions", "Track voice permissions, sound cues, music rights, and transcript text.", "Speech is intelligible and all audio has documented permission or ownership."),
        ("timeline", "Assemble and review the rough cut", "Arrange approved shots, sound, transitions, and captions in story order.", "The cut tells the intended story with consistent characters and readable captions."),
    ],
    "book": [
        ("plot", "Write the premise and chapter outline", "Define the reader promise, major arc, chapter purpose, and ending.", "Each chapter has a purpose and the outline delivers the reader promise."),
        ("characters", "Build character and continuity notes", "Track names, motivations, relationships, voice, and important facts.", "Recurring people or examples have consistent traits and roles."),
        ("manuscript", "Write a representative first chapter", "Establish voice, point of view, pacing, and reading level in a sample.", "The sample demonstrates the intended style and can guide later chapters."),
        ("manuscript", "Draft the remaining chapters", "Write in manageable chapter milestones using the outline and continuity notes.", "Every planned chapter has a complete draft and unresolved gaps are recorded."),
        ("research", "Check facts, references, and originality", "Review factual claims, quotations, permissions, and consistency.", "Claims have sources where needed and borrowed material has clear attribution."),
        ("manuscript", "Revise structure and line-edit", "Review the whole arc before polishing sentences, dialogue, and repeated wording.", "The manuscript has no unresolved structural gaps and passes a final proofread."),
        ("assets", "Prepare cover and interior layout", "Create title, cover direction, front matter, and readable chapter formatting.", "The intended reading format renders correctly and all assets have recorded rights."),
    ],
    "comic": [
        ("plot", "Outline the first complete story", "Map the conflict, turning point, ending, and page or scroll rhythm.", "The first scene has a clear emotional or narrative payoff."),
        ("characters", "Build consistent character sheets", "Record silhouettes, faces, clothing, expressions, and color references.", "Characters are recognizable across poses and panels."),
        ("manuscript", "Write the panel script", "Separate action, dialogue, captions, and sound effects by panel.", "Every panel has a clear visual purpose and concise readable text."),
        ("storyboard", "Thumbnail the panel sequence", "Check composition, reading order, speech placement, and page turns.", "A reader can follow the story from rough panels without explanation."),
        ("assets", "Finish one representative page", "Approve the line, color, lettering, and reference process before production.", "The sample is readable at the target screen or print size."),
        ("storyboard", "Produce and review the full sequence", "Complete approved panels and check continuity across adjacent images.", "Characters, settings, and reading direction remain consistent."),
    ],
    "website": [
        ("research", "Define the visitor and primary action", "Describe who arrives, what they need, and the one action that matters most.", "The main page has a clear promise and a measurable next action."),
        ("pages", "Map pages and navigation", "List routes, page purpose, content, and the links between them.", "Every required page has a purpose and the main action is easy to find."),
        ("manuscript", "Draft the core page content", "Write headings, descriptions, calls to action, and useful error or empty states.", "The copy answers the visitor's main questions without placeholder claims."),
        ("moodboard", "Set typography, color, and image direction", "Choose a small coherent style and accessible contrast targets.", "The design remains readable on narrow and wide screens."),
        ("pages", "Build the main responsive journey", "Implement the main pages and interactions before optional features.", "The primary journey works with keyboard, touch, and narrow-screen layouts."),
        ("pages", "Test links, forms, and failure states", "Check navigation, input validation, accessibility, and service failures.", "No broken links or inaccessible controls block the main task."),
    ],
    "app": [
        ("research", "Define the first user's main job", "Write a concrete problem, success outcome, and the smallest useful feature set.", "One user can describe how the app saves them time or solves a problem."),
        ("pages", "Map screens and data ownership", "List the main flow, stored records, roles, and empty, loading, and error states.", "Every screen and data field has a purpose and an owner."),
        ("pages", "Prototype one complete flow", "Build a usable slice with sample data before expanding the architecture.", "A user can finish the main job from beginning to end."),
        ("pages", "Implement persistence and recovery", "Save required data and include validation, ownership checks, and a backup or export path.", "Data survives reloads and one user cannot access another user's private records."),
        ("assets", "Polish the shared interface components", "Apply consistent typography, controls, spacing, labels, and interaction feedback.", "Core controls support keyboard and touch and display clear feedback."),
        ("pages", "Test the main flows and failure cases", "Cover important errors, slow connections, invalid input, and target devices.", "Critical flows pass realistic end-to-end checks and failures are recoverable."),
    ],
    "podcast": [
        ("research", "Define the show promise and pilot topic", "Describe the listener, value, recurring format, and evidence needed.", "The episode serves a clear listener need and has a focused topic."),
        ("manuscript", "Write the episode rundown", "Plan the opening, segments, transitions, questions, and closing.", "The outline fits the target duration and includes a strong opening."),
        ("audio", "Record a short voice and sound test", "Check the recording or narration workflow and speaker permissions.", "The sample is clear and the voice source and consent are documented."),
        ("audio", "Produce and edit the pilot", "Record approved material, remove distracting gaps, and add licensed cues.", "The episode is intelligible with consistent volume and clean transitions."),
        ("manuscript", "Prepare transcript and show notes", "Summarize the episode and attach sources, credits, and accessible text.", "A reader can follow the episode and find its referenced sources."),
        ("timeline", "Plan a repeatable episode workflow", "Record the production steps, review points, and realistic release cadence.", "The next episode has a clear checklist and manageable scope."),
    ],
    "music": [
        ("audio", "Define the musical brief and structure", "Record mood, tempo direction, instrumentation, sections, and intended use.", "The piece has a clear beginning, development, and ending or loop."),
        ("manuscript", "Write original lyrics or motif notes", "Draft a lyrical idea or melodic theme that fits the intended mood.", "The words or motif are original and support the piece's structure."),
        ("audio", "Make a short arrangement demo", "Test the core melody, rhythm, and sound palette before producing a full track.", "The demo establishes the intended sound and has an approved direction."),
        ("audio", "Produce the full arrangement", "Build sections and track sources for performances, samples, and generated material.", "All intended sections exist and usage rights are recorded."),
        ("audio", "Mix and check on several playback devices", "Balance parts, control clipping, and check the piece at different volumes.", "The export is clear with no accidental clipping, missing parts, or abrupt cuts."),
        ("assets", "Prepare artwork and credits", "Create cover direction, contributor credits, and delivery metadata.", "The release has accurate titles, ownership notes, and required artwork."),
    ],
    "course": [
        ("lessons", "Define measurable learning outcomes", "Describe what learners can do at the end and what they need to know first.", "Each outcome names an observable action that can be assessed."),
        ("lessons", "Sequence lessons and practice", "Order concepts so each lesson builds on the previous one.", "Each lesson has one goal, an example, practice, and a success check."),
        ("lessons", "Build one complete pilot lesson", "Create the explanation, activity, example answer, and feedback.", "A sample learner can complete the activity and explain what they learned."),
        ("manuscript", "Draft the remaining lesson materials", "Use the tested structure for explanations, examples, and support notes.", "All planned lessons include clear instructions and prerequisite links."),
        ("assets", "Produce accessible teaching media", "Create required illustrations or demonstrations with captions and alt text.", "Learners can use the essential material without relying only on audio or color."),
        ("lessons", "Test assessments and revise confusing steps", "Check the rubric or quizzes against the promised learning outcomes.", "Assessments measure the intended skills and explain how to improve."),
    ],
    "brand": [
        ("research", "Define audience and positioning", "Describe the audience, promise, distinguishing traits, and competing expectations.", "The brand promise is specific and avoids unsupported claims."),
        ("manuscript", "Write the voice and message guide", "Choose tone, example phrases, and core messages for common situations.", "The examples are consistent and understandable to the intended audience."),
        ("moodboard", "Explore visual directions", "Collect references for type, color, composition, and imagery with source notes.", "One coherent direction is selected and explained."),
        ("assets", "Create and review an identity starter", "Develop mark concepts, palette, typography, and example applications.", "The chosen direction works at small sizes and in monochrome."),
        ("assets", "Build the most useful asset kit", "Produce the required templates and exports with clear filenames.", "The kit includes editable sources and usable export sizes."),
        ("design", "Document usage and ownership", "Record spacing, color values, voice rules, asset rights, and unresolved name checks.", "Someone else can apply the identity consistently using the guide."),
    ],
    "research": [
        ("research", "Define the research question and criteria", "State the question, scope, exclusions, and evidence needed to answer it.", "The question is answerable and the success criteria are explicit."),
        ("research", "Plan sources and search terms", "Choose primary sources where possible and track search coverage.", "The source plan includes alternative viewpoints and known limitations."),
        ("research", "Collect and annotate evidence", "Record source links, dates, relevant findings, and reliability notes.", "Every key claim can be traced to a source and observations are separated from inference."),
        ("research", "Compare findings and unresolved gaps", "Identify agreement, contradictions, uncertainty, and missing evidence.", "The analysis addresses the original question without hiding uncertainty."),
        ("manuscript", "Draft the final explanation", "Write findings, methods, limitations, and next steps for the intended reader.", "The conclusion follows from the evidence and cites supporting sources."),
        ("research", "Verify claims and reproducibility", "Recheck important claims, links, calculations, and the limits of the conclusion.", "A reader can retrace the important evidence and understand what remains unknown."),
    ],
    "other": [
        ("design", "Define a concrete finished result", "Turn the idea into an audience, outcome, and a small first deliverable.", "The result can be described and checked without vague quality claims."),
        ("research", "Resolve the biggest unknowns", "List decisions that affect feasibility and gather enough evidence to choose a route.", "The main risks have an answer, a test, or a clearly assigned next action."),
        ("moodboard", "Make the idea tangible", "Collect references or sketch a small example of the intended experience.", "The example communicates the direction to someone new to the project."),
        ("assets", "Build a small complete sample", "Create one useful slice with placeholders where appropriate.", "The sample demonstrates the core value from beginning to end."),
        ("tasks", "Review and expand the sample", "Get feedback, fix the largest issues, and choose the next bounded steps.", "Feedback is recorded and remaining work is split into clear tasks."),
    ],
}


def label_answers(kind, answers):
    return {q["id"]: next((option["label"] for option in q["options"] if option["id"] == answers.get(q["id"])), answers.get(q["id"], "Undecided")) for q in KIND_BY_ID[kind]["questions"]}


def make_plan(kind: str, prompt: str, answers: dict) -> dict:
    spec = KIND_BY_ID[kind]
    effective = {question["id"]: answers.get(question["id"], question["recommended"]) for question in spec["questions"]}
    labels = label_answers(kind, effective)
    unanswered = [question for question in spec["questions"] if question["id"] not in answers]
    assumptions = [f"Starting suggestion — {question['title']}: {labels[question['id']]}. Please confirm or change it." for question in unanswered]
    assumptions.append("This is a rules-based starter roadmap. Feasibility and current tool availability still need checking.")
    tasks = []

    def add(id, title, description, phase, acceptance, component="tasks", depends_on=None):
        tasks.append({"id": id, "title": title, "description": description, "status": "todo", "phase": phase,
                      "acceptance": acceptance, "depends_on": depends_on or [], "component": component})

    if kind in {"language", "book"}:
        records = {}
        if kind == "book":
            records["plot"] = [{"id": "story-premise", "title": "Story overview", "fields": {"act": "Overview", "premise": prompt}}]
        return BuilderWorkspace(kind=kind, initialized=True, brief=prompt, answers=answers,
                                assumptions=assumptions[:-1], components=spec["components"], detail_categories=spec["detail_categories"],
                                tasks=[], records=records, design="", plan_prompt=prompt).model_dump()

    add("scope", "Confirm the first finished version", f"Review this idea together: {prompt[:1000]}\nName the audience, success outcome, must-haves, and what can wait.", "Discover", ["The first deliverable and intended audience are written down.", "Must-haves and deferred ideas are clearly separated."], "design")
    add("decisions", "Resolve setup choices and assumptions", "Review the project blueprint and confirm any unanswered choices. Make a tiny experiment for decisions that cannot be answered from discussion.", "Decide", ["Unanswered choices are confirmed or remain visibly open.", "Important uncertainties have a concrete test or research task."], "design", ["scope"])
    add("tools-budget", "Check tools and access", f"Guidance: {labels['experience']}. Check what is available in Powwow and what needs an external editor or service.", "Decide", ["Required tools and account access are verified.", "A small draft establishes the production approach before expanding it.", "Heavy work has a viable hosted route if the user's device cannot run it."], "design", ["decisions"])
    previous = "tools-budget"
    for index, (component, title, description, accepted) in enumerate(STEPS[kind]):
        id = f"{kind}-{index + 1}"
        phase = "Prototype" if index < 3 else "Build" if index < len(STEPS[kind]) - 1 else "Review"
        add(id, title, description + f"\nProject direction: {prompt[:350]}", phase, [accepted], component, [previous])
        previous = id
    # Chosen options create work that a generic checklist often misses.
    if kind == "game" and effective.get("play_mode") == "online":
        add("game-network", "Validate a two-player network prototype", "Test the smallest shared session, reconnection, hosting requirements, privacy, and moderation before expanding multiplayer features.", "Prototype", ["Two clients share a consistent game state.", "Disconnects recover predictably and ongoing service requirements are recorded."], "game-design", ["game-2"])
    if kind in {"game", "app"} and effective.get("platform") in {"mobile", "console"}:
        add(kind + "-platform", "Verify target platform access and delivery", "Check input requirements, supported devices, developer access, packaging, and store or platform submission rules before committing to release.", "Decide", ["A test build runs on a target device or the access blocker is documented.", "Platform access and submission prerequisites are recorded."], "release", ["tools-budget"])
    if kind in {"website", "app"} and (effective.get("features") == "accounts" or effective.get("data") == "cloud"):
        add(kind + "-privacy", "Verify permissions and service recovery", "Define ownership and deletion behavior; test unauthorized access, service outages, and secret handling.", "Review", ["Private records cannot be accessed by another account.", "Error recovery and data export or deletion are documented."], "pages", [previous])
    add("final-review", "Review the whole experience with a new user", "Walk through the complete result on the intended device or format. Check accessibility, consistency, permissions, and the original success criteria.", "Review", ["A new user can experience the result without coaching.", "Release-blocking problems are fixed or explicitly recorded."], "tasks", [task["id"] for task in tasks if task["id"] not in {"scope", "decisions", "tools-budget"}])
    add("release", "Package and share the first version", "Prepare the final files or build, credits, short usage notes, and a safe sharing destination. Verify delivery requirements before publishing.", "Release", ["The final deliverable opens or runs in its target format.", "Required credits, permissions, and useful instructions are included."], "release", ["final-review"])
    add("next-version", "Capture feedback and the next small improvement", "Record what worked, what confused people, and which ideas should wait until the next version.", "Release", ["Feedback is recorded and the next milestone is small enough to finish."], "tasks", ["release"])
    decision_lines = [f"- **{question['title']}** {labels[question['id']]} ({'chosen or stated in the brief' if question['id'] in answers else 'suggestion; awaiting confirmation'})" for question in spec["questions"]]
    task_lines = [f"- **{task['phase']}: {task['title']}** — {task['acceptance'][0]}" for task in tasks]
    tools_note = "Use Powwow's planning, text, and available media tools for drafts. Verify the current provider catalog before generating. The specialized editors organize work; engine builds, final editing, distribution, and store submissions may require additional tools."
    if kind == "game":
        tools_note += f" Game route: {labels['engine']}; target: {labels['platform']}; world: {labels['dimension']}; camera: {labels['perspective']}; players: {labels['play_mode']}. Validate this combination in the first playable sample."
    design = "\n\n".join([
        f"# {spec['name']} project blueprint",
        "## Starting idea\n" + prompt,
        "## Destination and first milestone\nFinish one small, complete version that someone else can try, read, watch, or use. Define the audience and a measurable success check before expanding the scope.",
        "## Setup decisions\n" + "\n".join(decision_lines),
        "## Assumptions and open decisions\n" + "\n".join("- " + item for item in assumptions),
        "## Scope\nInclude the essential end-to-end experience and one representative example first. Defer extra platforms, large content libraries, optional integrations, and polish that does not improve the core result. The task board is the editable source for remaining work.",
        "## Tools and feasibility\n" + tools_note,
        "## Access and production\nStart with text plans, placeholders, and small samples. Reuse approved characters and assets. Verify tool access and delivery limits before expanding production.",
        "## Milestones and acceptance checks\n" + "\n".join(task_lines),
        "## Review and release\nTest with someone new to the project. Check usability, readability, captions or alt text where needed, asset rights, and the target format. Ship a small complete version, record feedback, and choose the next improvement.",
        "## Planning method\nThis initial roadmap is generated locally from structured project templates and your brief. It has not performed external research or verified technical feasibility. Use the project's chats to investigate open questions and refine this document and task board.",
    ])
    components = list(spec["components"])
    return BuilderWorkspace(kind=kind, initialized=True, brief=prompt, answers=answers, assumptions=assumptions,
                            components=components, detail_categories=spec["detail_categories"], tasks=tasks, records={}, design=design, plan_prompt=prompt).model_dump()


def plan_project(db: Session, project: Project, body: PlanRequest) -> dict:
    current = get_workspace(db, project.id)
    existing = current["workspace"]
    request_kind = body.kind or detect_kind(body.prompt) or existing["kind"]
    if (not project.archived and not body.explicit and existing["initialized"]
            and existing["plan_prompt"] == body.prompt.strip() and request_kind == existing["kind"]
            and all(existing["answers"].get(key) == value for key, value in body.answers.items())):
        # A lost response can be retried safely even though automatic preview
        # now correctly reports the project as already planned.
        return {**current, "eligible": True, "reason": "plan_replayed"}
    preview = preview_plan(db, project, body, current)
    if not preview["eligible"]:
        return {**current, "eligible": False, "reason": preview["reason"]}
    answers = preview["answers"]
    generated = make_plan(preview["kind"], body.prompt.strip(), answers)
    if existing["initialized"] or existing["tasks"] or existing["design"] or existing["records"]:
        # Replanning is additive. Stable IDs prevent a replay from duplicating
        # cards or overwriting a user's edits, completion state, or manuscript.
        known = {task["id"] for task in existing["tasks"]}
        generated["tasks"] = existing["tasks"] + [task for task in generated["tasks"] if task["id"] not in known]
        generated["components"] = list(dict.fromkeys([*existing["components"], *generated["components"]]))
        generated["records"] = existing["records"]
        generated["detail_categories"] = existing.get("detail_categories", [])
        generated["design"] = existing["design"] or generated["design"]
        generated["brief"] = existing["brief"] or generated["brief"]
        generated["assumptions"] = list(dict.fromkeys([*existing["assumptions"], *generated["assumptions"]]))
    if generated == existing:
        return {**current, "eligible": True, "reason": "existing_plan_preserved"}
    result = save_workspace(db, project.id, current["version"], generated)
    return {**result, "eligible": True, "reason": "existing_plan_preserved" if existing["initialized"] else None}
