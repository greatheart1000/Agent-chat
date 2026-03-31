from __future__ import annotations

import unittest

from servers.db_mcp_server.server import is_readonly_sql


class DbSqlGuardTests(unittest.TestCase):
    def test_select_is_allowed(self) -> None:
        self.assertTrue(is_readonly_sql("SELECT * FROM orders LIMIT 10"))

    def test_with_select_is_allowed(self) -> None:
        self.assertTrue(is_readonly_sql("WITH t AS (SELECT 1) SELECT * FROM t"))

    def test_delete_is_blocked(self) -> None:
        self.assertFalse(is_readonly_sql("DELETE FROM orders"))

    def test_with_delete_is_blocked(self) -> None:
        self.assertFalse(is_readonly_sql("WITH x AS (DELETE FROM orders RETURNING *) SELECT * FROM x"))

    def test_pragma_assignment_is_blocked(self) -> None:
        self.assertFalse(is_readonly_sql("PRAGMA journal_mode = WAL"))

    def test_multi_statement_is_blocked(self) -> None:
        self.assertFalse(is_readonly_sql("SELECT 1; SELECT 2"))


if __name__ == "__main__":
    unittest.main()
