from __future__ import annotations

import argparse
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON = sys.executable

SERVER_SCRIPTS = [
    ("db", ROOT / "servers" / "db_mcp_server" / "server.py"),
    ("file", ROOT / "servers" / "file_mcp_server" / "server.py"),
    ("order", ROOT / "servers" / "order_mcp_server" / "server.py"),
    ("infra", ROOT / "servers" / "infra_mcp_server" / "server.py"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start all MCP servers")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--base-port", type=int, default=18001)
    parser.add_argument("--transport", choices=["streamable-http", "stdio", "sse"], default="streamable-http")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    procs: list[subprocess.Popen[str]] = []

    def shutdown(*_: object) -> None:
        for proc in procs:
            if proc.poll() is None:
                proc.terminate()
        for proc in procs:
            if proc.poll() is None:
                proc.wait(timeout=5)
        raise SystemExit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    for idx, (name, script) in enumerate(SERVER_SCRIPTS):
        port = args.base_port + idx
        cmd = [
            PYTHON,
            str(script),
            "--transport",
            args.transport,
            "--host",
            args.host,
            "--port",
            str(port),
        ]
        proc = subprocess.Popen(cmd, cwd=str(ROOT), text=True)
        procs.append(proc)
        print(f"started {name} on :{port} (pid={proc.pid})")

    try:
        while True:
            dead = [proc for proc in procs if proc.poll() is not None]
            if dead:
                raise RuntimeError(f"Some servers exited unexpectedly: {[p.pid for p in dead]}")
            time.sleep(1)
    finally:
        shutdown()


if __name__ == "__main__":
    main()
