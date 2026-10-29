"""Small idempotent upgrades for existing installations; never remove user rows."""
import re
import sqlite3
from pathlib import Path

from sqlalchemy import inspect, text

TABLES = ("chats", "artifacts", "runs")


def component_chat_sessions(connection):
    if "component_id" not in {item["name"] for item in inspect(connection).get_columns("chats")}:
        connection.execute(text("ALTER TABLE chats ADD COLUMN component_id VARCHAR(80)"))
    if "owner_id" not in {item["name"] for item in inspect(connection).get_columns("chats")}:
        # Very early schemas may run the component-column migration before
        # their ownership upgrade; preserve that migration's narrow contract.
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_project_component_chat ON chats (project_id, component_id)"))
        return
    if connection.dialect.name == "postgresql":
        connection.execute(text("ALTER TABLE chats DROP CONSTRAINT IF EXISTS uq_project_component_chat"))
    connection.execute(text("DROP INDEX IF EXISTS uq_project_component_chat"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_project_component_owner_chat ON chats (project_id, component_id, owner_id)"))


def collaboration_projects(connection):
    if "organization_id" not in {item["name"] for item in inspect(connection).get_columns("projects")}:
        connection.execute(text("ALTER TABLE projects ADD COLUMN organization_id VARCHAR(36) REFERENCES organizations(id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_projects_organization_id ON projects (organization_id)"))


def sqlite_private_component_sessions(engine):
    """Replace SQLite's table-level legacy uniqueness without losing user chats."""
    raw = engine.raw_connection()
    connection = raw.driver_connection
    try:
        schema = connection.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='chats'").fetchone()[0]
        legacy = r"(?i)CONSTRAINT\s+uq_project_component_chat\s+UNIQUE\s*\(\s*project_id\s*,\s*component_id\s*\)"
        if not re.search(legacy, schema):
            return
        upgraded = re.sub(legacy, "CONSTRAINT uq_project_component_owner_chat UNIQUE (project_id, component_id, owner_id)", schema)
        upgraded = re.sub(r'(?i)^(CREATE TABLE\s+)(?:"chats"|chats)(?=\s|\()', r'\1"_upgrade_chats"', upgraded, count=1)
        path = engine.url.database
        if path and path != ":memory:":
            backup_path = Path(path).with_suffix(Path(path).suffix + ".before-private-components")
            if not backup_path.exists():
                with sqlite3.connect(backup_path) as backup:
                    connection.backup(backup)
        extras = connection.execute("SELECT sql FROM sqlite_master WHERE tbl_name='chats' AND type IN ('index','trigger') AND sql IS NOT NULL AND name != 'uq_project_component_chat'").fetchall()
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(upgraded)
        columns = ','.join('"' + row[1] + '"' for row in connection.execute('PRAGMA table_info("chats")'))
        count = connection.execute('SELECT COUNT(*) FROM chats').fetchone()[0]
        connection.execute(f'INSERT INTO _upgrade_chats ({columns}) SELECT {columns} FROM chats')
        if connection.execute('SELECT COUNT(*) FROM _upgrade_chats').fetchone()[0] != count:
            raise RuntimeError("Chat migration row-count mismatch; original data retained.")
        connection.execute('DROP TABLE chats')
        connection.execute('ALTER TABLE _upgrade_chats RENAME TO chats')
        for (sql,) in extras:
            connection.execute(sql)
        if connection.execute("PRAGMA foreign_key_check").fetchone():
            raise RuntimeError("Chat migration foreign-key check failed; original data retained.")
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.execute("PRAGMA foreign_keys=ON")
        raw.close()


def project_storage_choice(connection):
    # NULL preserves the account default for existing projects. No files move.
    if "storage_mode" not in {item["name"] for item in inspect(connection).get_columns("projects")}:
        connection.execute(text("ALTER TABLE projects ADD COLUMN storage_mode VARCHAR(20)"))


def postgres_nullable_projects(connection):
    for table in TABLES:
        column = next(item for item in inspect(connection).get_columns(table) if item["name"] == "project_id")
        if not column["nullable"]:
            connection.execute(text(f'ALTER TABLE "{table}" ALTER COLUMN project_id DROP NOT NULL'))


def sqlite_nullable_projects(engine):
    affected = [table for table in TABLES if any(item["name"] == "project_id" and not item["nullable"] for item in inspect(engine).get_columns(table))]
    if not affected:
        return
    # SQLite cannot drop NOT NULL in place. Preserve a database backup first,
    # then copy every row and recreate original indexes/triggers atomically.
    raw = engine.raw_connection()
    connection = raw.driver_connection
    try:
        path = engine.url.database
        if path and path != ":memory:":
            backup_path = Path(path).with_suffix(Path(path).suffix + ".before-standalone")
            if not backup_path.exists():
                with sqlite3.connect(backup_path) as backup:
                    connection.backup(backup)
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        for table in affected:
            schema = connection.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()[0]
            extras = connection.execute("SELECT sql FROM sqlite_master WHERE tbl_name=? AND type IN ('index','trigger') AND sql IS NOT NULL", (table,)).fetchall()
            temporary = "_upgrade_" + table
            upgraded = re.sub(r"(?i)(\bproject_id\b\s+[^,\n]+?)\s+NOT NULL", r"\1", schema)
            if upgraded == schema:
                raise RuntimeError(f"Cannot safely identify {table}.project_id; migration stopped without changes.")
            upgraded = re.sub(r'(?i)^(CREATE TABLE\s+)(?:"' + table + r'"|' + table + r')(?=\s|\()', lambda match: match.group(1) + '"' + temporary + '"', upgraded, count=1)
            connection.execute(upgraded)
            columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]
            quoted = ",".join('"' + name + '"' for name in columns)
            count = connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            connection.execute(f'INSERT INTO "{temporary}" ({quoted}) SELECT {quoted} FROM "{table}"')
            if connection.execute(f'SELECT COUNT(*) FROM "{temporary}"').fetchone()[0] != count:
                raise RuntimeError("Migration row-count mismatch; original data retained.")
            connection.execute(f'DROP TABLE "{table}"')
            connection.execute(f'ALTER TABLE "{temporary}" RENAME TO "{table}"')
            for (sql,) in extras:
                connection.execute(sql)
        if connection.execute("PRAGMA foreign_key_check").fetchone():
            raise RuntimeError("Migration foreign-key check failed; original data retained.")
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.execute("PRAGMA foreign_keys=ON")
        raw.close()
