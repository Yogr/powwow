"""Lossless, idempotent upgrade of generic editors into project categories."""

DETAIL_CATEGORIES = {
    "memory": "Project notes", "characters": "Characters", "plot": "Story & plot",
    "timeline": "Timeline", "game-design": "Game design", "world": "World & locations",
    "audio": "Audio", "moodboard": "Visual references", "pages": "Pages & screens",
    "lessons": "Lessons", "research": "Research", "release": "Release",
}


def component_id(value):
    return "details" if value in DETAIL_CATEGORIES or value.startswith("detail-") else value


def consolidate_details(document):
    categories = document.setdefault("detail_categories", [])
    known = {item["id"] for item in categories}
    discovered = False
    records = document.setdefault("records", {})
    for key in [*document.get("components", []), *records]:
        if key in DETAIL_CATEGORIES and key not in known:
            name = DETAIL_CATEGORIES[key]
            names = {item["name"].strip().casefold() for item in categories}
            suffix = 2
            while name.casefold() in names:
                name = f"{DETAIL_CATEGORIES[key]} ({suffix})"
                suffix += 1
            categories.append({"id": key, "name": name})
            known.add(key)
            discovered = True
    for key in known:
        for record in records.get(key, []):
            fields = record["fields"]
            extra = [(name, value) for name, value in fields.items()
                     if name not in {"description", "reference"} and value]
            if extra:
                sections = [fields.get("description", "")]
                sections.extend(f"{name.replace('_', ' ').capitalize()}:\n{value}" for name, value in extra)
                record["fields"] = {"description": "\n\n".join(part for part in sections if part),
                                    **({"reference": fields["reference"]} if "reference" in fields else {})}
    document["components"] = list(dict.fromkeys(component_id(key) for key in document.get("components", [])))
    if discovered and "details" not in document["components"]:
        document["components"].append("details")
    for task in document.get("tasks", []):
        task["component"] = component_id(task["component"])
    return document
