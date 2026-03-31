from __future__ import annotations

import argparse
import ipaddress
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from mcp.server.fastmcp import FastMCP


WEATHER_MOCK = {
    "beijing": {"temp_c": 18, "condition": "Sunny"},
    "shanghai": {"temp_c": 21, "condition": "Cloudy"},
    "shenzhen": {"temp_c": 26, "condition": "Rain"},
}

BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "0.0.0.0",
    "::1",
    "host.docker.internal",
    "gateway.docker.internal",
}


def is_safe_http_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    if not parsed.hostname:
        return False

    host = parsed.hostname.strip().lower().rstrip(".")
    if host in BLOCKED_HOSTNAMES or host.endswith(".local") or host.endswith(".internal"):
        return False

    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return True

    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def create_server(host: str, port: int) -> FastMCP:
    mcp = FastMCP(
        name="infra-mcp-server",
        instructions="Infrastructure wrappers: weather, HTTP gateway, notification mock.",
        host=host,
        port=port,
        streamable_http_path="/mcp",
    )

    @mcp.tool(name="infra_get_weather")
    def infra_get_weather(city: str) -> dict[str, Any]:
        """Get weather info (mocked)."""
        key = city.strip().lower()
        weather = WEATHER_MOCK.get(key, {"temp_c": 20, "condition": "Unknown"})
        return {
            "city": city,
            "temp_c": weather["temp_c"],
            "condition": weather["condition"],
            "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "source": "mock",
        }

    @mcp.tool(name="infra_http_get_json")
    async def infra_http_get_json(url: str, timeout_sec: int = 8) -> dict[str, Any]:
        """HTTP GET and return JSON body."""
        if not is_safe_http_url(url):
            raise ValueError("Unsafe URL. Only external http(s) URLs are allowed.")

        timeout = max(1, min(timeout_sec, 30))
        async with httpx.AsyncClient(timeout=timeout, trust_env=False, follow_redirects=False) as client:
            response = await client.get(url)
            response.raise_for_status()
            try:
                body = response.json()
            except ValueError as exc:
                raise ValueError("Response body is not valid JSON") from exc
            return {
                "url": str(response.url),
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "json": body,
            }

    @mcp.tool(name="infra_send_sms")
    def infra_send_sms(phone: str, message: str) -> dict[str, Any]:
        """Mock SMS sender."""
        return {
            "phone": phone,
            "message": message,
            "status": "QUEUED",
            "provider": "mock-sms",
            "requested_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        }

    @mcp.resource("runbook://infra/retry-policy")
    def infra_retry_policy() -> str:
        return "Infra retry policy: timeout 8s, retry up to 2 times with exponential backoff for 5xx errors."

    @mcp.prompt(name="infra_incident_prompt")
    def infra_incident_prompt(problem: str) -> str:
        return (
            "You are an oncall engineer. Triage dependency health, identify blast radius, propose immediate mitigation.\\n"
            f"Incident: {problem}"
        )

    return mcp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Infra MCP Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18004)
    parser.add_argument("--transport", choices=["streamable-http", "stdio", "sse"], default="streamable-http")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mcp = create_server(args.host, args.port)
    mcp.run(args.transport)


if __name__ == "__main__":
    main()
