from __future__ import annotations

import unittest

from servers.infra_mcp_server.server import is_safe_http_url


class InfraUrlSafetyTests(unittest.TestCase):
    def test_public_https_url_is_allowed(self) -> None:
        self.assertTrue(is_safe_http_url("https://example.com/data.json"))

    def test_loopback_is_blocked(self) -> None:
        self.assertFalse(is_safe_http_url("http://127.0.0.1:8000/health"))

    def test_private_ipv4_is_blocked(self) -> None:
        self.assertFalse(is_safe_http_url("http://10.0.0.5/api"))

    def test_loopback_ipv6_is_blocked(self) -> None:
        self.assertFalse(is_safe_http_url("http://[::1]/api"))

    def test_non_http_scheme_is_blocked(self) -> None:
        self.assertFalse(is_safe_http_url("ftp://example.com/file.json"))

    def test_internal_hostname_is_blocked(self) -> None:
        self.assertFalse(is_safe_http_url("https://host.docker.internal/api"))


if __name__ == "__main__":
    unittest.main()
