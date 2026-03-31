from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from contextlib import AsyncExitStack
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

ROOT = Path(__file__).resolve().parent

DEFAULT_SERVER_URLS = {
    "db": "http://127.0.0.1:18001/mcp",
    "file": "http://127.0.0.1:18002/mcp",
    "order": "http://127.0.0.1:18003/mcp",
    "infra": "http://127.0.0.1:18004/mcp",
}

KNOWN_CLOSE_ERRORS = (
    "Attempted to exit cancel scope in a different task than it was entered in",
    "Attempted to exit a cancel scope that isn't the current tasks's current cancel scope",
    "Cancelled via cancel scope",
)


def is_known_close_error(exc: BaseException) -> bool:
    queue: list[BaseException] = [exc]
    while queue:
        current = queue.pop()
        message = str(current)
        if any(flag in message for flag in KNOWN_CLOSE_ERRORS):
            return True

        if isinstance(current, BaseExceptionGroup):
            queue.extend(current.exceptions)
        if current.__cause__ is not None:
            queue.append(current.__cause__)
        if current.__context__ is not None:
            queue.append(current.__context__)

    return False


@dataclass
class ServerConnection:
    name: str
    url: str
    stack: AsyncExitStack | None = None
    session: ClientSession | None = None

    async def connect(self) -> None:
        self.stack = AsyncExitStack()
        http_client = await self.stack.enter_async_context(
            httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=300.0), trust_env=False)
        )
        read_stream, write_stream, _ = await self.stack.enter_async_context(
            streamable_http_client(self.url, http_client=http_client)
        )
        self.session = await self.stack.enter_async_context(ClientSession(read_stream, write_stream))
        await self.session.initialize()

    async def close(self) -> None:
        if self.stack is not None:
            try:
                await self.stack.aclose()
            except BaseException as exc:
                # Python 3.13 + current anyio/mcp versions may raise a known shutdown
                # exception after successful calls; treat it as non-fatal.
                if isinstance(exc, (SystemExit, KeyboardInterrupt)):
                    raise
                if not is_known_close_error(exc) and not isinstance(exc, asyncio.CancelledError):
                    raise
                if os.getenv("MCP_DEBUG_CLOSE_ERRORS") == "1":
                    print(
                        f"[warn] ignored known streamable-http close error on '{self.name}': {exc}",
                        file=sys.stderr,
                    )
            finally:
                self.stack = None
                self.session = None


class MultiServerClient:
    def __init__(self, server_urls: dict[str, str]):
        self._server_urls = server_urls
        self._connections: dict[str, ServerConnection] = {}
        self._tool_index: dict[str, list[str]] = {}

    async def connect_all(self) -> None:
        for name, url in self._server_urls.items():
            conn = ServerConnection(name=name, url=url)
            await conn.connect()
            self._connections[name] = conn

        await self.refresh_tool_index()

    async def close(self) -> None:
        for conn in self._connections.values():
            await conn.close()
        self._connections.clear()
        self._tool_index.clear()

    async def refresh_tool_index(self) -> None:
        self._tool_index = {}
        for server_name, conn in self._connections.items():
            assert conn.session is not None
            tools = (await conn.session.list_tools()).tools
            for tool in tools:
                self._tool_index.setdefault(tool.name, []).append(server_name)

    async def list_tools(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for server_name, conn in self._connections.items():
            assert conn.session is not None
            result = await conn.session.list_tools()
            for tool in result.tools:
                rows.append(
                    {
                        "server": server_name,
                        "name": tool.name,
                        "description": tool.description,
                        "input_schema": tool.inputSchema,
                    }
                )
        return rows

    async def list_resources(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for server_name, conn in self._connections.items():
            assert conn.session is not None
            result = await conn.session.list_resources()
            for resource in result.resources:
                rows.append(
                    {
                        "server": server_name,
                        "uri": str(resource.uri),
                        "name": resource.name,
                        "description": resource.description,
                        "mime_type": resource.mimeType,
                    }
                )
        return rows

    async def read_resource(self, server: str, uri: str) -> dict[str, Any]:
        conn = self._connections.get(server)
        if not conn or not conn.session:
            raise ValueError(f"Unknown server: {server}")
        result = await conn.session.read_resource(uri)  # pydantic parses uri string into AnyUrl.
        return {
            "server": server,
            "uri": uri,
            "contents": [item.model_dump(mode="json") for item in result.contents],
        }

    async def call_tool(self, tool_name: str, arguments: dict[str, Any], server: str | None = None) -> dict[str, Any]:
        target_server = server
        if target_server is None:
            matches = self._tool_index.get(tool_name, [])
            if not matches:
                raise ValueError(f"Tool not found: {tool_name}")
            if len(matches) > 1:
                raise ValueError(
                    f"Tool '{tool_name}' exists in multiple servers {matches}. Use --server to disambiguate."
                )
            target_server = matches[0]

        conn = self._connections.get(target_server)
        if not conn or not conn.session:
            raise ValueError(f"Unknown server: {target_server}")

        result = await conn.session.call_tool(tool_name, arguments=arguments)
        payload = {
            "server": target_server,
            "tool": tool_name,
            "is_error": result.isError,
            "structured_content": result.structuredContent,
            "content": [self._content_to_json(item) for item in result.content],
        }
        return payload

    @staticmethod
    def _content_to_json(item: Any) -> dict[str, Any]:
        if hasattr(item, "model_dump"):
            return item.model_dump(mode="json")
        if hasattr(item, "text"):
            return {"type": "text", "text": item.text}
        return {"value": str(item)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="MCP multi-server client (streamable-http)")
    parser.add_argument(
        "--servers-file",
        type=Path,
        help="JSON file mapping server name -> streamable-http URL, e.g. {\"db\":\"http://127.0.0.1:18001/mcp\"}",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("list-tools")
    subparsers.add_parser("list-resources")

    read_resource_parser = subparsers.add_parser("read-resource")
    read_resource_parser.add_argument("--server", required=True)
    read_resource_parser.add_argument("--uri", required=True)

    call_parser = subparsers.add_parser("call")
    call_parser.add_argument("tool", help="Tool name")
    call_parser.add_argument("--args", default="{}", help="JSON object for tool arguments")
    call_parser.add_argument("--server", help="Optional target server name")

    return parser.parse_args()


def load_server_urls(servers_file: Path | None) -> dict[str, str]:
    if not servers_file:
        return DEFAULT_SERVER_URLS

    payload = json.loads(servers_file.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("servers-file must contain a JSON object")

    server_urls: dict[str, str] = {}
    for key, value in payload.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise ValueError("servers-file must be a mapping of string->string")
        server_urls[key] = value
    return server_urls


async def run() -> None:
    args = parse_args()
    server_urls = load_server_urls(args.servers_file)
    client = MultiServerClient(server_urls)
    await client.connect_all()

    try:
        if args.command == "list-tools":
            data = await client.list_tools()
        elif args.command == "list-resources":
            data = await client.list_resources()
        elif args.command == "read-resource":
            data = await client.read_resource(server=args.server, uri=args.uri)
        elif args.command == "call":
            try:
                tool_args = json.loads(args.args)
            except json.JSONDecodeError as exc:
                raise ValueError(f"--args is not valid JSON: {exc}") from exc
            if not isinstance(tool_args, dict):
                raise ValueError("--args must be a JSON object")

            data = await client.call_tool(tool_name=args.tool, arguments=tool_args, server=args.server)
        else:
            raise ValueError(f"Unsupported command: {args.command}")

        print(json.dumps(data, ensure_ascii=False, indent=2))
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(run())
