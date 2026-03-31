from __future__ import annotations

import unittest

from client import is_known_close_error


class ClientHelperTests(unittest.TestCase):
    def test_known_close_error_is_detected(self) -> None:
        err = RuntimeError("Attempted to exit cancel scope in a different task than it was entered in")
        self.assertTrue(is_known_close_error(err))

    def test_non_close_error_is_not_detected(self) -> None:
        err = ValueError("some other error")
        self.assertFalse(is_known_close_error(err))


if __name__ == "__main__":
    unittest.main()
