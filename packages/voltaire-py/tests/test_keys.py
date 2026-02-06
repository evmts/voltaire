"""Tests for key generation and compression."""

import pytest
from voltaire.secp256k1 import Secp256k1
from voltaire.errors import InvalidLengthError


# secp256k1 curve order
SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


class TestGeneratePrivateKey:
    """Tests for Secp256k1.generate_private_key."""

    def test_returns_32_bytes(self):
        """Generated key is 32 bytes."""
        key = Secp256k1.generate_private_key()
        assert len(key) == 32
        assert isinstance(key, bytes)

    def test_returns_different_keys(self):
        """Multiple calls return different keys."""
        key1 = Secp256k1.generate_private_key()
        key2 = Secp256k1.generate_private_key()
        key3 = Secp256k1.generate_private_key()

        assert key1 != key2
        assert key2 != key3
        assert key1 != key3

    def test_key_is_nonzero(self):
        """Generated key is never all zeros."""
        for _ in range(10):
            key = Secp256k1.generate_private_key()
            assert key != bytes(32)

    def test_key_is_less_than_curve_order(self):
        """Generated key is less than secp256k1 curve order N."""
        for _ in range(10):
            key = Secp256k1.generate_private_key()
            key_int = int.from_bytes(key, "big")
            assert key_int < SECP256K1_N

    def test_key_is_valid_for_derivation(self):
        """Generated key can be used to derive public key."""
        key = Secp256k1.generate_private_key()
        pubkey = Secp256k1.public_key_from_private(key)
        assert len(pubkey) == 64


class TestCompressPublicKey:
    """Tests for Secp256k1.compress_public_key."""

    def test_compresses_to_33_bytes(self):
        """Compression produces 33-byte output."""
        # Generator point (private key = 1)
        uncompressed = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        compressed = Secp256k1.compress_public_key(uncompressed)
        assert len(compressed) == 33

    def test_even_y_prefix(self):
        """Even y coordinate produces 0x02 prefix."""
        # Generator point has even y (ends in ...b8)
        uncompressed = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        compressed = Secp256k1.compress_public_key(uncompressed)
        assert compressed[0] == 0x02

    def test_odd_y_prefix(self):
        """Odd y coordinate produces 0x03 prefix."""
        # Private key 6 has odd y (ends in ...97)
        uncompressed = bytes.fromhex(
            "fff97bd5755eeea420453a14355235d382f6472f8568a18b2f057a1460297556"
            "ae12777aacfbb620f3be96017f45c560de80f0f6518fe4a03c870c36b075f297"
        )
        compressed = Secp256k1.compress_public_key(uncompressed)
        assert compressed[0] == 0x03

    def test_x_coordinate_preserved(self):
        """Compressed key contains original x coordinate."""
        uncompressed = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        compressed = Secp256k1.compress_public_key(uncompressed)
        # x coordinate should be bytes 1-33 of compressed
        expected_x = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        assert compressed[1:] == expected_x

    def test_invalid_length_empty(self):
        """Reject empty input."""
        with pytest.raises(InvalidLengthError):
            Secp256k1.compress_public_key(bytes())

    def test_invalid_length_33_bytes(self):
        """Reject 33-byte (already compressed) input."""
        compressed = bytes(33)
        with pytest.raises(InvalidLengthError):
            Secp256k1.compress_public_key(compressed)

    def test_invalid_length_65_bytes(self):
        """Reject 65-byte (prefixed) input."""
        prefixed = bytes(65)
        with pytest.raises(InvalidLengthError):
            Secp256k1.compress_public_key(prefixed)

    def test_invalid_length_32_bytes(self):
        """Reject 32-byte input."""
        short = bytes(32)
        with pytest.raises(InvalidLengthError):
            Secp256k1.compress_public_key(short)

    def test_compress_derived_key(self):
        """Compress a key derived from private key."""
        private_key = bytes.fromhex(
            "0000000000000000000000000000000000000000000000000000000000000001"
        )
        public_key = Secp256k1.public_key_from_private(private_key)
        compressed = Secp256k1.compress_public_key(public_key)

        # Should match known compressed form of generator point
        expected = bytes.fromhex(
            "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        assert compressed == expected

    def test_compress_multiple_keys(self):
        """Compress multiple keys with different parities."""
        test_cases = [
            {
                # Private key 1 (generator) - even y
                "uncompressed": bytes.fromhex(
                    "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
                    "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
                ),
                "expected_prefix": 0x02,
            },
            {
                # Private key 6 - odd y
                "uncompressed": bytes.fromhex(
                    "fff97bd5755eeea420453a14355235d382f6472f8568a18b2f057a1460297556"
                    "ae12777aacfbb620f3be96017f45c560de80f0f6518fe4a03c870c36b075f297"
                ),
                "expected_prefix": 0x03,
            },
        ]

        for case in test_cases:
            compressed = Secp256k1.compress_public_key(case["uncompressed"])
            assert compressed[0] == case["expected_prefix"]


class TestKeyWorkflow:
    """Integration tests for key generation workflow."""

    def test_generate_derive_compress(self):
        """Full workflow: generate, derive, compress."""
        # Generate private key
        private_key = Secp256k1.generate_private_key()
        assert len(private_key) == 32

        # Derive public key
        public_key = Secp256k1.public_key_from_private(private_key)
        assert len(public_key) == 64

        # Compress public key
        compressed = Secp256k1.compress_public_key(public_key)
        assert len(compressed) == 33
        assert compressed[0] in (0x02, 0x03)

    def test_deterministic_compression(self):
        """Same public key always compresses to same result."""
        private_key = bytes.fromhex(
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        )
        public_key = Secp256k1.public_key_from_private(private_key)

        compressed1 = Secp256k1.compress_public_key(public_key)
        compressed2 = Secp256k1.compress_public_key(public_key)

        assert compressed1 == compressed2
