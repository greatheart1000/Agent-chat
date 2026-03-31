from __future__ import annotations

import argparse
import fnmatch
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP

ROOT = Path(__file__).resolve().parents[2]
FILE_ROOT = ROOT
MAX_SEARCH_FILE_BYTES = 2 * 1024 * 1024
MAX_BINARY_SNIFF_BYTES = 2048


def resolve_safe_path(relative_path: str) -> Path:
    target = (FILE_ROOT / relative_path).resolve()
    if FILE_ROOT not in target.parents and target != FILE_ROOT:
        raise ValueError("Path escapes FILE_ROOT and is not allowed.")
    return target


def is_probably_binary(path: Path) -> bool:
    try:
        with path.open("rb") as fp:
            sample = fp.read(MAX_BINARY_SNIFF_BYTES)
        return b"\x00" in sample
    except OSError:
        return True


def create_server(host: str, port: int) -> FastMCP:
    mcp = FastMCP(
        name="file-mcp-server",
        instructions="File read and search tools restricted to FILE_ROOT.",
        host=host,
        port=port,
        streamable_http_path="/mcp",
    )

    @mcp.tool(name="file_list_directory")
    def file_list_directory(path: str = ".") -> list[dict[str, Any]]:
        """List files and folders under a directory."""
        directory = resolve_safe_path(path)
        if not directory.exists() or not directory.is_dir():
            raise ValueError(f"Directory not found: {path}")

        items: list[dict[str, Any]] = []
        for item in sorted(directory.iterdir(), key=lambda p: p.name):
            info = {
                "name": item.name,
                "relative_path": str(item.relative_to(FILE_ROOT)),
                "type": "dir" if item.is_dir() else "file",
            }
            if item.is_file():
                info["size"] = item.stat().st_size
            items.append(info)
        return items

    @mcp.tool(name="file_read_text")
    def file_read_text(path: str, max_chars: int = 10000) -> dict[str, Any]:
        """Read a UTF-8 text file with a character cap."""
        file_path = resolve_safe_path(path)
        if not file_path.exists() or not file_path.is_file():
            raise ValueError(f"File not found: {path}")
        if is_probably_binary(file_path):
            raise ValueError(f"Binary file is not supported: {path}")

        clamped_max = max(100, min(max_chars, 200000))
        with file_path.open("r", encoding="utf-8", errors="replace") as fp:
            content = fp.read(clamped_max + 1)
        truncated = len(content) > clamped_max
        return {
            "path": str(file_path.relative_to(FILE_ROOT)),
            "truncated": truncated,
            "content": content[:clamped_max],
        }

    @mcp.tool(name="file_search_in_files")
    def file_search_in_files(
        pattern: str,
        path: str = ".",
        glob: str = "*",
        case_sensitive: bool = False,
        max_hits: int = 50,
    ) -> list[dict[str, Any]]:
        """Search text pattern in files recursively."""
        base_dir = resolve_safe_path(path)
        if not base_dir.exists() or not base_dir.is_dir():
            raise ValueError(f"Directory not found: {path}")

        clamped_hits = max(1, min(max_hits, 500))
        needle = pattern if case_sensitive else pattern.lower()

        hits: list[dict[str, Any]] = []
        for file_path in base_dir.rglob("*"):
            if len(hits) >= clamped_hits:
                break
            if not file_path.is_file():
                continue
            if not fnmatch.fnmatch(file_path.name, glob):
                continue
            try:
                if file_path.stat().st_size > MAX_SEARCH_FILE_BYTES:
                    continue
                if is_probably_binary(file_path):
                    continue
            except OSError:
                continue

            try:
                with file_path.open("r", encoding="utf-8", errors="ignore") as fp:
                    for idx, line in enumerate(fp, start=1):
                        line_cmp = line if case_sensitive else line.lower()
                        if needle in line_cmp:
                            hits.append(
                                {
                                    "path": str(file_path.relative_to(FILE_ROOT)),
                                    "line": idx,
                                    "text": line.rstrip("\n")[:300],
                                }
                            )
                            if len(hits) >= clamped_hits:
                                break
            except OSError:
                continue

        return hits

    @mcp.resource("runbook://file/security")
    def file_security_runbook() -> str:
        return (
            "File MCP security: all reads and searches are constrained under FILE_ROOT. "
            "Path traversal outside FILE_ROOT is blocked."
        )

    @mcp.prompt(name="file_log_analysis_prompt")
    def file_log_analysis_prompt(problem_statement: str) -> str:
        return (
            "You are debugging a production issue. Use file_search_in_files and file_read_text to locate root cause.\\n"
            f"Problem: {problem_statement}"
        )

    return mcp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="File MCP Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18002)
    parser.add_argument("--transport", choices=["streamable-http", "stdio", "sse"], default="streamable-http")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mcp = create_server(args.host, args.port)
    mcp.run(args.transport)


if __name__ == "__main__":
    main()
