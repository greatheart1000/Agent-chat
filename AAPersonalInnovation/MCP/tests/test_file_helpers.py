from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from servers.file_mcp_server.server import is_probably_binary


class FileHelperTests(unittest.TestCase):
    def test_text_file_is_not_binary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            file_path = Path(tmp_dir) / "a.txt"
            file_path.write_text("hello\nworld\n", encoding="utf-8")
            self.assertFalse(is_probably_binary(file_path))

    def test_binary_file_is_binary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            file_path = Path(tmp_dir) / "a.bin"
            file_path.write_bytes(b"\x00\x01\x02")
            self.assertTrue(is_probably_binary(file_path))


if __name__ == "__main__":
    unittest.main()
