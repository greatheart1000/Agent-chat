from __future__ import annotations

import unittest

from servers.order_mcp_server.server import normalize_status


class OrderStatusTests(unittest.TestCase):
    def test_normalize_uppercase(self) -> None:
        self.assertEqual(normalize_status("paid"), "PAID")

    def test_invalid_status_raises(self) -> None:
        with self.assertRaises(ValueError):
            normalize_status("SHIPPED")


if __name__ == "__main__":
    unittest.main()
