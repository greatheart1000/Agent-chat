from __future__ import annotations

import argparse
import re
import sqlite3
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path((ROOT / "data" / "app.db").resolve())
ALLOWED_SQL_PREFIXES = ("select", "with", "explain", "pragma")
IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
STRING_LITERAL_PATTERN = re.compile(r"'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"")
FORBIDDEN_SQL_PATTERN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach|vacuum|reindex|analyze)\b",
    re.IGNORECASE,
)
PRAGMA_ASSIGN_PATTERN = re.compile(r"\bpragma\b[^;]*=", re.IGNORECASE)


def bootstrap_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS customers (
                customer_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                level TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                status TEXT NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
            )
            """
        )

        customer_count = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
        if customer_count == 0:
            conn.executemany(
                "INSERT INTO customers(customer_id, name, email, level) VALUES (?, ?, ?, ?)",
                [
                    ("C1001", "Alice Zhang", "alice@example.com", "gold"),
                    ("C1002", "Bob Li", "bob@example.com", "silver"),
                    ("C1003", "Carol Wang", "carol@example.com", "bronze"),
                ],
            )

        order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
        if order_count == 0:
            conn.executemany(
                "INSERT INTO orders(order_id, customer_id, status, amount, created_at) VALUES (?, ?, ?, ?, ?)",
                [
                    ("O1001", "C1001", "PAID", 299.0, "2026-03-29T09:10:00+08:00"),
                    ("O1002", "C1002", "PENDING", 89.9, "2026-03-30T14:25:00+08:00"),
                    ("O1003", "C1003", "REFUNDED", 59.5, "2026-03-31T08:40:00+08:00"),
                ],
            )
        conn.commit()


def is_readonly_sql(sql: str) -> bool:
    normalized = sql.strip().lower()
    if not normalized:
        return False
    if not normalized.startswith(ALLOWED_SQL_PREFIXES):
        return False

    # sqlite3.execute expects one statement. We explicitly block chained SQL.
    body = normalized.rstrip()
    if ";" in body[:-1]:
        return False

    scrubbed = STRING_LITERAL_PATTERN.sub("", normalized)
    if FORBIDDEN_SQL_PATTERN.search(scrubbed):
        return False
    if PRAGMA_ASSIGN_PATTERN.search(scrubbed):
        return False

    return True


def validate_identifier(name: str) -> str:
    if not IDENTIFIER_PATTERN.match(name):
        raise ValueError(f"Invalid identifier: {name}")
    return name


def create_server(host: str, port: int) -> FastMCP:
    mcp = FastMCP(
        name="db-mcp-server",
        instructions="Readonly database tools over SQLite. Suitable for analytics and diagnostics.",
        host=host,
        port=port,
        streamable_http_path="/mcp",
    )

    @mcp.tool(name="db_list_tables")
    def db_list_tables() -> list[dict[str, str]]:
        """List all user tables in the database."""
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ).fetchall()
        return [{"table_name": name} for (name,) in rows]

    @mcp.tool(name="db_describe_table")
    def db_describe_table(table_name: str) -> list[dict[str, Any]]:
        """Describe columns for a given table."""
        safe_name = validate_identifier(table_name)
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute(f"PRAGMA table_info({safe_name})").fetchall()
        return [
            {
                "cid": row[0],
                "name": row[1],
                "type": row[2],
                "notnull": bool(row[3]),
                "default": row[4],
                "pk": bool(row[5]),
            }
            for row in rows
        ]

    @mcp.tool(name="db_execute_readonly_sql")
    def db_execute_readonly_sql(sql: str, limit: int = 100) -> dict[str, Any]:
        """Execute readonly SQL and return rows."""
        if not is_readonly_sql(sql):
            raise ValueError("Only readonly SQL is allowed. Prefix must be SELECT/WITH/EXPLAIN/PRAGMA.")

        clamped_limit = max(1, min(limit, 1000))

        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql)
            rows = [dict(row) for row in cursor.fetchmany(clamped_limit)]

        return {
            "row_count": len(rows),
            "limit": clamped_limit,
            "rows": rows,
        }

    @mcp.resource("runbook://db/readonly-policy")
    def db_readonly_policy() -> str:
        return (
            "DB MCP policy: this server only exposes readonly SQL. "
            "Use db_execute_readonly_sql for SELECT/WITH/EXPLAIN/PRAGMA statements."
        )

    @mcp.prompt(name="db_query_review_prompt")
    def db_query_review_prompt(user_question: str) -> str:
        return (
            "You are an analytics assistant. Given the question below, draft a safe readonly SQL query, "
            "explain assumptions, and include a LIMIT.\\n\\n"
            f"Question: {user_question}"
        )

    return mcp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DB MCP Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18001)
    parser.add_argument("--transport", choices=["streamable-http", "stdio", "sse"], default="streamable-http")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    bootstrap_db()
    mcp = create_server(args.host, args.port)
    mcp.run(args.transport)


if __name__ == "__main__":
    main()
