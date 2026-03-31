from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "orders.json"
ALLOWED_ORDER_STATUS = {"PAID", "PENDING", "REFUNDED", "CANCELED"}

DEFAULT_DATA = {
    "customers": [
        {
            "customer_id": "C1001",
            "name": "Alice Zhang",
            "phone": "13800000001",
            "segment": "vip",
        },
        {
            "customer_id": "C1002",
            "name": "Bob Li",
            "phone": "13800000002",
            "segment": "regular",
        },
        {
            "customer_id": "C1003",
            "name": "Carol Wang",
            "phone": "13800000003",
            "segment": "new",
        },
    ],
    "orders": [
        {
            "order_id": "O1001",
            "customer_id": "C1001",
            "status": "PAID",
            "amount": 299.0,
            "currency": "CNY",
            "created_at": "2026-03-29T09:10:00+08:00",
            "notes": [
                {
                    "author": "system",
                    "content": "First successful order.",
                    "created_at": "2026-03-29T09:10:00+08:00",
                }
            ],
        },
        {
            "order_id": "O1002",
            "customer_id": "C1002",
            "status": "PENDING",
            "amount": 89.9,
            "currency": "CNY",
            "created_at": "2026-03-30T14:25:00+08:00",
            "notes": [],
        },
        {
            "order_id": "O1003",
            "customer_id": "C1003",
            "status": "REFUNDED",
            "amount": 59.5,
            "currency": "CNY",
            "created_at": "2026-03-31T08:40:00+08:00",
            "notes": [],
        },
    ],
}


def bootstrap_data() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_PATH.exists():
        DATA_PATH.write_text(json.dumps(DEFAULT_DATA, ensure_ascii=False, indent=2), encoding="utf-8")


def load_data() -> dict[str, Any]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def save_data(payload: dict[str, Any]) -> None:
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def normalize_status(status: str) -> str:
    normalized = status.strip().upper()
    if normalized not in ALLOWED_ORDER_STATUS:
        raise ValueError(f"Invalid order status: {status}. Allowed: {sorted(ALLOWED_ORDER_STATUS)}")
    return normalized


def create_server(host: str, port: int) -> FastMCP:
    mcp = FastMCP(
        name="order-mcp-server",
        instructions="Business-oriented order/customer tools.",
        host=host,
        port=port,
        streamable_http_path="/mcp",
    )

    @mcp.tool(name="order_get_detail")
    def order_get_detail(order_id: str) -> dict[str, Any]:
        """Get order detail by order_id."""
        data = load_data()
        order = next((x for x in data["orders"] if x["order_id"] == order_id), None)
        if not order:
            raise ValueError(f"Order not found: {order_id}")
        return order

    @mcp.tool(name="order_search_orders")
    def order_search_orders(
        status: str | None = None,
        customer_keyword: str | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search orders by status and/or customer keyword."""
        data = load_data()
        customers = {c["customer_id"]: c for c in data["customers"]}
        normalized_status = normalize_status(status) if status else None

        results: list[dict[str, Any]] = []
        key = customer_keyword.lower() if customer_keyword else None
        for order in data["orders"]:
            if normalized_status and order["status"] != normalized_status:
                continue
            if key:
                customer = customers.get(order["customer_id"], {})
                haystack = f"{customer.get('name', '')} {customer.get('phone', '')}".lower()
                if key not in haystack:
                    continue
            results.append(order)
            if len(results) >= max(1, min(limit, 200)):
                break
        return results

    @mcp.tool(name="order_get_customer_profile")
    def order_get_customer_profile(customer_id: str) -> dict[str, Any]:
        """Get customer profile and lightweight order stats."""
        data = load_data()
        customer = next((x for x in data["customers"] if x["customer_id"] == customer_id), None)
        if not customer:
            raise ValueError(f"Customer not found: {customer_id}")

        orders = [x for x in data["orders"] if x["customer_id"] == customer_id]
        return {
            "customer": customer,
            "stats": {
                "order_count": len(orders),
                "total_amount": round(sum(x["amount"] for x in orders), 2),
            },
        }

    @mcp.tool(name="order_create_note")
    def order_create_note(order_id: str, note: str, author: str = "agent") -> dict[str, Any]:
        """Append an order note."""
        data = load_data()
        order = next((x for x in data["orders"] if x["order_id"] == order_id), None)
        if not order:
            raise ValueError(f"Order not found: {order_id}")
        cleaned_note = note.strip()
        cleaned_author = author.strip() or "agent"
        if not cleaned_note:
            raise ValueError("Note cannot be empty")
        if len(cleaned_note) > 1000:
            raise ValueError("Note is too long (max 1000 chars)")

        note_item = {
            "author": cleaned_author,
            "content": cleaned_note,
            "created_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        }
        order.setdefault("notes", []).append(note_item)
        save_data(data)
        return {"order_id": order_id, "note": note_item, "note_count": len(order["notes"])}

    @mcp.tool(name="order_update_status")
    def order_update_status(
        order_id: str,
        status: str,
        operator: str = "agent",
        reason: str | None = None,
    ) -> dict[str, Any]:
        """Update order status and append an audit note."""
        data = load_data()
        order = next((x for x in data["orders"] if x["order_id"] == order_id), None)
        if not order:
            raise ValueError(f"Order not found: {order_id}")

        new_status = normalize_status(status)
        old_status = order["status"]
        if old_status == new_status:
            return {
                "order_id": order_id,
                "status": new_status,
                "changed": False,
                "message": "Status unchanged",
            }

        order["status"] = new_status
        note_text = f"Status changed from {old_status} to {new_status}"
        if reason and reason.strip():
            note_text += f"; reason: {reason.strip()}"
        note_item = {
            "author": operator.strip() or "agent",
            "content": note_text,
            "created_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        }
        order.setdefault("notes", []).append(note_item)
        save_data(data)

        return {
            "order_id": order_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed": True,
            "audit_note": note_item,
        }

    @mcp.resource("runbook://order/status-dictionary")
    def order_status_dictionary() -> str:
        return "PAID: 已支付; PENDING: 待支付; REFUNDED: 已退款; CANCELED: 已取消"

    @mcp.prompt(name="order_review_prompt")
    def order_review_prompt(user_goal: str) -> str:
        return (
            "你是订单运营分析助手。先查订单，再查客户画像，最后给出可执行建议。\\n"
            f"目标: {user_goal}"
        )

    return mcp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Order MCP Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18003)
    parser.add_argument("--transport", choices=["streamable-http", "stdio", "sse"], default="streamable-http")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    bootstrap_data()
    mcp = create_server(args.host, args.port)
    mcp.run(args.transport)


if __name__ == "__main__":
    main()
