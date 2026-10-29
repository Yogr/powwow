"""Database/bootstrap and contract commands. Schema changes need explicit migrations after v0.1."""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["init-db", "export-openapi"])
    parser.add_argument("--output", default="../../contracts/openapi.json")
    args = parser.parse_args()
    if args.command == "init-db":
        from .config import settings
        from .db import init_db
        settings().validate_runtime()
        init_db()
        print("Database schema initialized.")
    else:
        from .main import app
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
        print(f"OpenAPI written to {output.resolve()}")


if __name__ == "__main__":
    main()
