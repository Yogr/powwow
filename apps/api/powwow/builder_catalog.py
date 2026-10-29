"""Declarative creative modes, reusable components, and guided setup choices."""
from copy import deepcopy

from .language_catalog import LANGUAGES, LEVELS
from .project_details import DETAIL_CATEGORIES, component_id


def question(id, title, description, choices, recommended):
    return {"id": id, "title": title, "description": description,
            "options": [{"id": value, "label": label, "description": detail, "icon": icon}
                        for value, label, detail, icon in choices], "recommended": recommended}


COMMON_QUESTIONS = [
    question("experience", "How much guidance would you like?", "This changes the size of each step and how much we explain.", [
        ("beginner", "Guide every step", "Small steps, plain language, and a first working example.", "sparkles"),
        ("some", "I know a little", "Explain decisions and help with unfamiliar tools.", "compass"),
        ("experienced", "Move quickly", "Keep technical details available and focus on execution.", "zap"),
    ], "beginner"),
]

COMPONENTS = [
    ("memory", "Project Memory", "Confirmed project facts, constraints, themes, and glossary shared across conversations.", "book-open"),
    ("tasks", "Task Board", "Decisions, dependencies, acceptance checks, and work remaining.", "list-checks"),
    ("design", "Project Blueprint", "The brief, scope, decisions, assumptions, and plan in one editable document.", "compass"),
    ("characters", "Characters", "Reusable character identities, appearance, voice, motivations, and reference images.", "users"),
    ("plot", "Story & Plot", "Premise, arcs, beats, conflict, and continuity shared across storytelling projects.", "git-branch"),
    ("storyboard", "Storyboard", "Scene scripts, shots, first and last frame references, and camera direction.", "clapperboard"),
    ("manuscript", "Book & Script Editor", "Chapters, scenes, drafts, notes, and revision-ready text.", "book-open"),
    ("timeline", "Timeline", "Sequence scenes, chapters, milestones, and production notes.", "calendar-range"),
    ("game-design", "Game Design", "Core loop, controls, mechanics, levels, and playtest notes.", "gamepad-2"),
    ("world", "World Builder", "Locations, lore, rules, and consistent settings for any story world.", "globe"),
    ("audio", "Audio Studio", "Plan dialogue, tracks, sound cues, episodes, and recording notes.", "audio-lines"),
    ("moodboard", "Moodboard", "Collect visual references, palettes, composition, and style direction.", "palette"),
    ("assets", "Asset Library", "Track artwork, media, provenance, licensing, and production status.", "folder-open"),
    ("pages", "Pages & Screens", "Map screens, navigation, content, interactions, and accessibility notes.", "panels-top-left"),
    ("lessons", "Lesson Builder", "Learning goals, lesson plans, exercises, and assessment criteria.", "graduation-cap"),
    ("research", "Research Notebook", "Capture questions, evidence, source links, and unresolved findings.", "search"),
    ("release", "Release Checklist", "Package, review, publish, and track launch requirements.", "rocket"),
    ("language", "Learn a Language", "Daily conversations, word translations, listening, and speaking practice.", "languages"),
]


# Each experience chooses a small starting workspace. The full catalog remains
# available through Add components; a task's references do not install tools.
STARTER_COMPONENTS = {
    "language": ["language"],
    "book": ["plot", "timeline", "characters", "manuscript"],
    "game": ["design", "tasks", "game-design", "world"],
    "movie": ["plot", "characters", "manuscript", "storyboard"],
    "comic": ["plot", "characters", "storyboard"],
    "website": ["design", "tasks", "pages"],
    "app": ["design", "tasks", "pages"],
    "podcast": ["design", "audio", "manuscript"],
    "music": ["design", "audio"],
    "course": ["design", "lessons"],
    "brand": ["design", "moodboard"],
    "research": ["design", "research"],
    "other": ["design", "tasks"],
}


def mode(id, name, description, icon, components, questions):
    return {"id": id, "name": name, "description": description, "icon": icon,
            "components": STARTER_COMPONENTS[id],
            "recommended_components": list(dict.fromkeys([*STARTER_COMPONENTS[id], *components])),
            "questions": [*questions, *COMMON_QUESTIONS]}


KINDS = [
    {"id": "language", "name": "Learn a language", "description": "A patient conversation buddy, with a private daily journal for each learner.", "icon": "languages",
     "components": STARTER_COMPONENTS["language"], "questions": [
        question("target_language", "What would you like to speak?", "Practice one language per learning profile; add another profile any time.",
                 [(item["code"], item["name"], item["native_name"], "languages") for item in LANGUAGES], "es"),
        question("native_language", "Which language feels fluent?", "Translations and gentle explanations use this language.",
                 [(item["code"], item["name"], item["native_name"], "message-circle") for item in LANGUAGES], "en"),
        question("level", "Where are you starting?", "Choose the amount of support you want. This is not a test or certification.",
                 [(item["id"], item["name"], item["description"], "sprout") for item in LEVELS], "beginner"),
    ]},
    mode("game", "Game", "Turn an idea into a small playable world, then build it out.", "gamepad-2",
         ["game-design", "characters", "world", "moodboard", "assets", "audio", "release"], [
        question("dimension", "What kind of world?", "Choose a visual starting point. We can change it later.", [
            ("2d", "2D", "Flat artwork, clear controls, and a smaller first build.", "square"),
            ("3d", "3D", "Explore a world with depth, models, and lighting.", "box"),
        ], "2d"),
        question("perspective", "How will players see the game?", "The camera affects controls, art, and level design.", [
            ("side", "Side view", "Jump and move left to right, like a platformer.", "arrow-right"),
            ("top", "Top down", "Look down on puzzles, maps, or a whole room.", "arrow-down"),
            ("isometric", "Isometric", "An angled view that shows the world like a diorama.", "diamond"),
            ("first-person", "First person", "See through the player's eyes.", "eye"),
            ("third-person", "Third person", "Follow a character through a 3D world.", "person-standing"),
        ], "side"),
        question("engine", "Which building tool?", "If you are unsure, begin with a tiny browser game before committing to a larger tool.", [
            ("browser", "Browser starter", "A small web prototype that can be shared with a link.", "globe"),
            ("godot", "Godot", "A dedicated game editor for 2D or 3D projects.", "bot"),
            ("unity", "Unity", "A full game engine; plan for editor and platform setup.", "box"),
            ("unreal", "Unreal", "A full game engine; check hardware and build requirements.", "mountain"),
        ], "browser"),
        question("platform", "Where should people play?", "Start with one platform so the first version is achievable.", [
            ("web", "Web browser", "Open a link on a supported browser.", "globe"),
            ("desktop", "Desktop", "Keyboard, mouse, or controller on a computer.", "monitor"),
            ("mobile", "Phone or tablet", "Touch controls and small-screen testing.", "smartphone"),
            ("console", "Console", "Plan for platform access, certification, and extra setup.", "gamepad-2"),
        ], "web"),
        question("play_mode", "Who plays together?", "Online play adds server, account, and moderation work.", [
            ("solo", "One player", "The smallest route to a complete first game.", "user"),
            ("local", "Same-device friends", "Play together on one device.", "users"),
            ("online", "Online multiplayer", "Include networking and ongoing service requirements.", "network"),
        ], "solo"),
    ]),
    mode("movie", "Movie", "Develop your script, cast, shots, and a consistent visual sequence.", "clapperboard",
         ["characters", "plot", "storyboard", "manuscript", "timeline", "audio", "moodboard", "assets", "release"], [
        question("format", "What are we making?", "A short proof of concept helps establish the whole production style.", [
            ("short", "Short film", "Tell one focused story in a few scenes.", "film"),
            ("feature", "Feature", "Plan acts and validate the production pipeline with one scene.", "clapperboard"),
            ("series", "Series", "Build a show bible and a pilot episode.", "layers"),
        ], "short"),
        question("style", "Which visual style?", "We will use the same character and style references across shots.", [
            ("animation", "Animated", "Stylized characters and controlled visual direction.", "palette"),
            ("cinematic", "Cinematic", "Live-action-inspired framing and lighting.", "camera"),
            ("documentary", "Documentary", "Evidence, interviews, narration, and source tracking.", "video"),
        ], "animation"),
        question("duration", "How long is the first finished piece?", "Length drives shot count, editing time, and production requirements.", [
            ("one-minute", "About a minute", "A complete miniature story or proof of concept.", "timer"),
            ("five-minutes", "About five minutes", "Room for several scenes and a short narrative arc.", "clock"),
            ("longer", "Longer", "Break the project into separately reviewable sequences.", "hourglass"),
        ], "one-minute"),
        question("release_target", "Where will it be watched?", "Set the framing before generating final footage.", [
            ("landscape", "Wide screen", "Landscape framing for desktop and TV viewing.", "monitor"),
            ("vertical", "Phone first", "Vertical shots for mobile viewing.", "smartphone"),
            ("festival", "Screening", "Track delivery formats, captions, and release requirements.", "ticket"),
        ], "landscape"),
    ]),
    mode("book", "Book", "Plan characters and plot, then write and revise chapter by chapter.", "book-open",
         ["characters", "plot", "manuscript", "timeline", "world", "research", "moodboard", "assets", "release"], [
        question("format", "What kind of book?", "The editor and outline can support very different reading experiences.", [
            ("novel", "Novel", "A longer narrative with character arcs and chapters.", "book-open"),
            ("nonfiction", "Nonfiction", "An evidence-led structure with clear reader takeaways.", "library"),
            ("children", "Children's book", "Plan page turns, illustrations, and reading level.", "sparkles"),
            ("short-story", "Short story", "A focused arc with a small cast.", "file-text"),
        ], "novel"),
        question("genre", "What is the story's direction?", "Use this as a starting point; the brief can combine genres.", [
            ("fantasy", "Fantasy", "Invent worlds, rules, and wonder.", "wand"),
            ("scifi", "Science fiction", "Explore imagined science, technology, or futures.", "orbit"),
            ("mystery", "Mystery", "Track clues, reveals, and reader expectations.", "search"),
            ("realistic", "Real life", "Ground the book in people, experience, or practical knowledge.", "users"),
        ], "fantasy"),
        question("length", "How big should the first draft be?", "Start with a complete outline and one sample chapter.", [
            ("short", "A short read", "A focused, manageable first book.", "file"),
            ("medium", "A chapter book", "Several chapters with a clear progression.", "book"),
            ("long", "A full-length book", "Use chapter milestones and planned revision passes.", "library"),
        ], "short"),
        question("publishing", "How would you like to share it?", "Final formatting depends on the reading format.", [
            ("digital", "Digital", "Prepare a readable ebook or PDF draft.", "tablet"),
            ("print", "Print", "Include trim size, layout, cover, and proof checks.", "printer"),
            ("private", "Just for us", "A polished copy for a small audience.", "heart"),
        ], "digital"),
    ]),
    mode("comic", "Comic", "Create a visual story with reusable characters and panel-by-panel pacing.", "panels-top-left",
         ["characters", "plot", "storyboard", "manuscript", "world", "moodboard", "assets", "release"], [
        question("format", "How will readers move through it?", "Choose panel rhythm and layout before illustrating.", [
            ("pages", "Page by page", "Traditional pages and deliberate page turns.", "book-open"),
            ("webtoon", "Vertical scroll", "Panels paced for reading on a phone.", "smartphone"),
            ("strip", "Short strips", "Compact scenes or recurring episodes.", "columns"),
        ], "pages"),
        question("style", "How should the artwork feel?", "A visual reference sheet keeps panels consistent.", [
            ("cartoon", "Cartoon", "Expressive shapes and readable silhouettes.", "smile"),
            ("manga", "Manga inspired", "Strong line work and expressive panel language.", "pen-tool"),
            ("painted", "Painted", "Textured, illustration-led visual storytelling.", "paintbrush"),
        ], "cartoon"),
        question("color", "Color or monochrome?", "Limit the palette to keep production consistent.", [
            ("color", "Full color", "Plan a reusable palette for each scene.", "palette"),
            ("mono", "Black and white", "Use value, shape, and line for clarity.", "contrast"),
            ("limited", "Limited palette", "A few carefully selected colors.", "droplets"),
        ], "limited"),
        question("scope", "How much should we make first?", "A short complete scene proves the approach.", [
            ("scene", "One scene", "Finish a handful of panels before expanding.", "layout"),
            ("issue", "One issue", "Plan a complete short issue with an ending.", "book"),
            ("series", "A series", "Build the series bible and a pilot first.", "layers"),
        ], "scene"),
    ]),
    mode("website", "Website", "Map the pages, content, and interactions that make your site useful.", "globe",
         ["pages", "manuscript", "moodboard", "assets", "research", "release"], [
        question("purpose", "What should the site do?", "One main goal keeps the first version clear.", [
            ("landing", "Introduce an idea", "A focused landing page with one next action.", "flag"),
            ("portfolio", "Show my work", "Projects, background, and ways to connect.", "image"),
            ("store", "Sell products", "Include catalog, checkout, and order flows.", "shopping-bag"),
            ("community", "Bring people together", "Plan membership, content, and moderation.", "users"),
        ], "landing"),
        question("style", "Which visual direction?", "Create an accessible design with a clear hierarchy.", [
            ("minimal", "Clean and simple", "Quiet typography and focused content.", "square"),
            ("playful", "Playful", "Color and personality with easy navigation.", "sparkles"),
            ("editorial", "Editorial", "Strong type and image-led storytelling.", "newspaper"),
        ], "minimal"),
        question("content", "Do you already have content?", "We can draft text and track missing assets.", [
            ("draft", "Help me write it", "Start with the audience and key message.", "pencil"),
            ("existing", "I have content", "Organize and adapt existing copy and assets.", "folder"),
            ("mixed", "A little of both", "Reuse what is ready and fill the gaps.", "layers"),
        ], "draft"),
        question("features", "How interactive is the first version?", "Accounts and payments require additional service setup.", [
            ("static", "Read and explore", "Pages, links, and simple content.", "file"),
            ("forms", "Forms and contact", "Include data handling and spam checks.", "mail"),
            ("accounts", "Accounts or payments", "Include authentication, permissions, and service access.", "lock"),
        ], "static"),
    ]),
    mode("app", "App", "Define useful flows, design screens, and validate a small working release.", "smartphone",
         ["pages", "moodboard", "assets", "research", "release"], [
        question("platform", "Where will the app run?", "One platform makes a first release easier to test.", [
            ("web", "Web browser", "A link-based app for broad access.", "globe"),
            ("mobile", "Phone or tablet", "Touch interactions and store delivery planning.", "smartphone"),
            ("desktop", "Desktop", "Computer-focused workflows and installation.", "monitor"),
        ], "web"),
        question("audience", "Who is the first version for?", "A real small audience helps define the useful core.", [
            ("personal", "Me and my family", "Keep setup and sharing simple.", "heart"),
            ("team", "A small team", "Define roles and shared workflows.", "users"),
            ("public", "Anyone", "Plan privacy, abuse prevention, and support.", "globe"),
        ], "personal"),
        question("data", "Where should information live?", "Syncing data adds accounts, storage, and service requirements.", [
            ("local", "On the device", "Start with local data and an export path.", "hard-drive"),
            ("cloud", "Synced online", "Use managed storage with ownership checks.", "cloud"),
            ("none", "No saved data", "A lightweight tool with no account required.", "zap"),
        ], "local"),
        question("scope", "How far should the first version go?", "Prove the main user journey before broadening features.", [
            ("prototype", "Working prototype", "One useful flow with sample data.", "flask-conical"),
            ("mvp", "Small usable release", "A complete core flow with error states and testing.", "check"),
            ("production", "Launch-ready", "Include deployment, monitoring, security, and support.", "rocket"),
        ], "prototype"),
    ]),
    mode("podcast", "Podcast", "Plan episodes, write scripts, and organize recording and release.", "mic",
         ["audio", "manuscript", "timeline", "research", "moodboard", "assets", "release"], [
        question("format", "What kind of show?", "The format guides scripts and production needs.", [
            ("solo", "Solo host", "A focused voice and clear episode outline.", "user"),
            ("interview", "Interviews", "Guest research, questions, and recording logistics.", "users"),
            ("fiction", "Audio stories", "Characters, scenes, sound cues, and continuity.", "theater"),
        ], "solo"),
        question("duration", "How long is an episode?", "A short pilot helps test the voice and editing process.", [
            ("short", "5–10 minutes", "A concise first episode.", "timer"),
            ("medium", "20–30 minutes", "Room for several segments or an interview.", "clock"),
            ("long", "45 minutes or more", "Plan pacing, chapters, and a larger edit.", "hourglass"),
        ], "short"),
        question("voice", "How will it be voiced?", "Plan rights and consent for every speaker.", [
            ("record", "Record my voice", "Write a recording checklist and editing plan.", "mic"),
            ("synthetic", "AI narration", "Check available voice tools, consent, and access.", "audio-lines"),
            ("mixed", "A mix", "Keep voice sources and permissions organized.", "layers"),
        ], "record"),
        question("cadence", "How often should episodes appear?", "A realistic schedule helps you finish consistently.", [
            ("pilot", "Just a pilot", "Finish one episode before choosing a schedule.", "flag"),
            ("weekly", "Weekly", "Build a repeatable production checklist.", "calendar"),
            ("monthly", "Monthly", "Leave more room for research and editing.", "calendar-days"),
        ], "pilot"),
    ]),
    mode("music", "Music", "Develop a sound, write a structure, and organize tracks and release notes.", "music",
         ["audio", "manuscript", "timeline", "moodboard", "assets", "release"], [
        question("format", "What are we producing?", "Choose one finished piece before planning a larger collection.", [
            ("song", "A song", "Structure, lyrics, arrangement, and a finished mix.", "music"),
            ("instrumental", "Instrumental", "Melody, rhythm, and arrangement without a vocal.", "piano"),
            ("soundtrack", "A soundtrack", "Plan cues around a story, game, or visual sequence.", "film"),
        ], "song"),
        question("mood", "What should it feel like?", "A few reference notes help keep the sound coherent.", [
            ("uplifting", "Uplifting", "Bright energy and forward motion.", "sun"),
            ("calm", "Calm", "Space, warmth, and gentle movement.", "waves"),
            ("dramatic", "Dramatic", "Tension, contrast, and release.", "zap"),
        ], "uplifting"),
        question("vocals", "Will there be vocals?", "Use original material and track voice permissions.", [
            ("none", "Instrumental only", "Focus on melody and arrangement.", "piano"),
            ("record", "My own vocals", "Plan lyrics, recording, and editing.", "mic"),
            ("synthetic", "AI vocals", "Check available tools and rights before production.", "audio-lines"),
        ], "none"),
        question("release_target", "Where is the music going?", "The final format depends on the use case.", [
            ("personal", "Personal listening", "A finished export to enjoy and share privately.", "headphones"),
            ("streaming", "Music release", "Include metadata, artwork, and distributor checks.", "radio"),
            ("project", "Another project", "Export loops, stems, or cues for a game or film.", "folder"),
        ], "personal"),
    ]),
    mode("course", "Course", "Turn an outcome into lessons, practice, and useful feedback.", "graduation-cap",
         ["lessons", "manuscript", "storyboard", "research", "audio", "assets", "release"], [
        question("audience", "Who will learn from it?", "Vocabulary and examples should fit the learner.", [
            ("children", "Children", "Short activities and clear, age-appropriate language.", "smile"),
            ("beginners", "Adult beginners", "Explain prerequisites and build confidence.", "sprout"),
            ("advanced", "Experienced learners", "Focus on practice and deeper skills.", "graduation-cap"),
        ], "beginners"),
        question("format", "How should lessons work?", "Choose the simplest format that supports the outcome.", [
            ("text", "Read and practice", "Written lessons with exercises and examples.", "book-open"),
            ("video", "Video lessons", "Scripts, demonstrations, captions, and practice.", "video"),
            ("interactive", "Interactive", "Activities, feedback, and assessment flows.", "mouse-pointer"),
        ], "text"),
        question("length", "How much learning time?", "A small pilot lesson will test the approach first.", [
            ("mini", "A mini course", "One outcome in a few short lessons.", "timer"),
            ("workshop", "A workshop", "A focused session with practice time.", "presentation"),
            ("series", "A full series", "A sequence of milestones and assessments.", "layers"),
        ], "mini"),
        question("assessment", "How will learners show progress?", "Assess what the course promises to teach.", [
            ("project", "Make something", "Complete a practical project with a clear rubric.", "hammer"),
            ("quiz", "Quick checks", "Short questions with explanatory feedback.", "list-checks"),
            ("reflection", "Guided reflection", "Prompts to apply learning to a real situation.", "notebook"),
        ], "project"),
    ]),
    mode("brand", "Brand", "Define a voice, visual direction, and a usable set of identity assets.", "palette",
         ["moodboard", "assets", "manuscript", "research", "release"], [
        question("purpose", "What are we giving an identity?", "The audience and context guide the design choices.", [
            ("business", "A business", "Positioning, trust, and a consistent customer experience.", "briefcase"),
            ("personal", "My personal brand", "A voice and identity that fit your work.", "user"),
            ("project", "A creative project", "A coherent style for a game, film, or community.", "sparkles"),
        ], "project"),
        question("tone", "How should it feel?", "Pick a clear direction before generating lots of assets.", [
            ("friendly", "Warm and friendly", "Approachable language and inviting visual choices.", "smile"),
            ("bold", "Bold and energetic", "Confident voice and strong visual contrast.", "zap"),
            ("refined", "Calm and refined", "Restrained typography, color, and composition.", "gem"),
        ], "friendly"),
        question("assets_scope", "Which assets matter first?", "Start with what you need to use immediately.", [
            ("starter", "Identity starter", "A mark, palette, typography, and short voice guide.", "palette"),
            ("social", "Social kit", "Profile art, reusable post templates, and voice notes.", "message-circle"),
            ("full", "Full brand guide", "Usage rules, applications, and editable source files.", "book-open"),
        ], "starter"),
    ]),
    mode("research", "Research", "Organize questions, evidence, analysis, and a clear final deliverable.", "search",
         ["research", "manuscript", "timeline", "assets", "release"], [
        question("goal", "What should the research help you do?", "Define the decision or question before gathering sources.", [
            ("understand", "Understand a topic", "Build a readable explanation with sources.", "book-open"),
            ("compare", "Compare options", "Set criteria and compare evidence consistently.", "columns"),
            ("test", "Test an idea", "Define a hypothesis, method, and success criteria.", "flask-conical"),
        ], "understand"),
        question("depth", "How deep should we go?", "We will keep evidence and uncertainty visible.", [
            ("overview", "A useful overview", "A focused set of credible sources and key findings.", "map"),
            ("deep", "A deep study", "A documented search and more detailed analysis.", "search"),
            ("ongoing", "Ongoing research", "Track open questions and periodic updates.", "repeat"),
        ], "overview"),
        question("deliverable", "What should the result look like?", "Choose a format that helps your audience use the findings.", [
            ("report", "Written report", "A clear narrative with citations and limitations.", "file-text"),
            ("presentation", "Presentation", "A concise story for discussing the findings.", "presentation"),
            ("comparison", "Comparison", "A structured evidence table and recommendation.", "table"),
        ], "report"),
    ]),
    mode("other", "Something else", "Start with your idea and assemble the tools that fit it.", "sparkles",
         ["research", "moodboard", "assets", "release"], [
        question("outcome", "What kind of result do you imagine?", "We can add specialized tools as the idea becomes clearer.", [
            ("digital", "A digital creation", "Something people can open, use, read, or watch.", "monitor"),
            ("physical", "A real-world project", "Plans, assets, sourcing, and a build checklist.", "box"),
            ("explore", "Help me explore", "Clarify the idea with examples and a small prototype.", "compass"),
        ], "explore"),
        question("audience", "Who are you making it for?", "Start with a concrete audience and a small useful result.", [
            ("personal", "For myself", "Optimize for learning and enjoyment.", "user"),
            ("small", "People I know", "Ask a few people to try the first version.", "users"),
            ("public", "A wider audience", "Include access, packaging, and launch planning.", "globe"),
        ], "personal"),
        question("scope", "Where should we start?", "A finished small version makes the next step easier to choose.", [
            ("prototype", "Try a small version", "Make the core idea tangible quickly.", "flask-conical"),
            ("plan", "Explore the plan", "Resolve the important unknowns before making.", "map"),
            ("release", "Finish and share", "Work toward a polished, complete deliverable.", "rocket"),
        ], "prototype"),
    ]),
]

LEGACY_COMPONENT_IDS = set(DETAIL_CATEGORIES)
COMPONENTS = [item for item in COMPONENTS if item[0] not in DETAIL_CATEGORIES]
COMPONENTS.insert(2, ("details", "Project Details", "Names, descriptions and images, organized into your own categories.", "notebook"))
for kind in KINDS:
    kind["detail_categories"] = [{"id": key, "name": DETAIL_CATEGORIES[key]} for key in kind["components"] if key in DETAIL_CATEGORIES]
    for field in ("components", "recommended_components"):
        if field in kind:
            kind[field] = list(dict.fromkeys(component_id(key) for key in kind[field]))
KIND_BY_ID = {kind["id"]: kind for kind in KINDS}
# Accept old document buckets for lossless migration, but do not offer them as tools.
COMPONENT_IDS = {item[0] for item in COMPONENTS} | LEGACY_COMPONENT_IDS


def builder_catalog(priorities=None):
    defaults = {item[0]: 100 + index * 10 for index, item in enumerate(COMPONENTS)}
    ordered = {**defaults, **(priorities or {}), "design": 1, "tasks": 2}
    components = [{**dict(zip(("id", "name", "description", "icon"), item)), "priority": ordered[item[0]]} for item in COMPONENTS]
    return {"kinds": deepcopy(KINDS), "components": sorted(components, key=lambda item: (item["priority"], item["name"]))}
