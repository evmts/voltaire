"""
RLP encoding tests.

Test vectors derived from Ethereum specification and Zig implementation.
"""

import sys
from pathlib import Path

import pytest

# Add src to path for direct import
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from voltaire.rlp import Rlp, rlp_encode


class TestRlpEncodeBytes:
    """Tests for Rlp.encode_bytes()"""

    def test_empty_bytes(self):
        """Empty bytes encode as 0x80."""
        
        result = Rlp.encode_bytes(b"")
        assert result == b"\x80"

    def test_single_byte_below_0x80(self):
        """Single byte < 0x80 encodes as itself."""
        
        # 0x0f (15) should encode as itself
        result = Rlp.encode_bytes(b"\x0f")
        assert result == b"\x0f"

        # 0x7f (127) should encode as itself
        result = Rlp.encode_bytes(b"\x7f")
        assert result == b"\x7f"

        # 'a' (0x61) should encode as itself
        result = Rlp.encode_bytes(b"a")
        assert result == b"a"

    def test_single_byte_at_or_above_0x80(self):
        """Single byte >= 0x80 gets prefix."""
        
        # 0x80 should get prefix 0x81
        result = Rlp.encode_bytes(b"\x80")
        assert result == b"\x81\x80"

        # 0xff should get prefix 0x81
        result = Rlp.encode_bytes(b"\xff")
        assert result == b"\x81\xff"

    def test_short_string(self):
        """Strings 0-55 bytes get 0x80+len prefix."""
        
        # "dog" (3 bytes) -> 0x83 + "dog"
        result = Rlp.encode_bytes(b"dog")
        assert result == b"\x83dog"
        assert result[0] == 0x80 + 3

        # "cat" (3 bytes) -> 0x83 + "cat"
        result = Rlp.encode_bytes(b"cat")
        assert result == b"\x83cat"

    def test_55_byte_string(self):
        """Exactly 55 bytes uses short form (boundary case)."""
        
        data = b"a" * 55
        result = Rlp.encode_bytes(data)
        assert len(result) == 56
        assert result[0] == 0x80 + 55  # 0xb7
        assert result[1:] == data

    def test_56_byte_string(self):
        """56 bytes uses long form."""
        
        data = b"a" * 56
        result = Rlp.encode_bytes(data)
        # 0xb8 (0xb7 + 1 length byte) + 56 (length) + data
        assert result[0] == 0xb8
        assert result[1] == 56
        assert result[2:] == data

    def test_long_string(self):
        """Strings > 55 bytes use long form."""
        
        # 70 bytes
        long_str = b"zoo255zoo255zzzzzzzzzzzzssssssssssssssssssssssssssssssssssssssssssssss"
        assert len(long_str) == 70
        result = Rlp.encode_bytes(long_str)
        # 0xb8 (0xb7 + 1) + length byte + data
        assert result[0] == 0xb8
        assert result[1] == 70
        assert result[2:] == long_str


class TestRlpEncodeUint:
    """Tests for Rlp.encode_uint()"""

    def test_zero(self):
        """Zero encodes as empty bytes (0x80)."""
        
        result = Rlp.encode_uint(0)
        assert result == b"\x80"

    def test_small_integer(self):
        """Integers < 128 encode as single byte."""
        
        result = Rlp.encode_uint(15)
        assert result == b"\x0f"

        result = Rlp.encode_uint(127)
        assert result == b"\x7f"

    def test_integer_128(self):
        """Integer 128 needs prefix."""
        
        result = Rlp.encode_uint(128)
        assert result == b"\x81\x80"

    def test_multi_byte_integer(self):
        """Multi-byte integers use big-endian, minimal bytes."""
        
        # 1024 = 0x0400 (2 bytes)
        result = Rlp.encode_uint(1024)
        assert result == b"\x82\x04\x00"

        # 256 = 0x0100 (2 bytes, not 3)
        result = Rlp.encode_uint(256)
        assert result == b"\x82\x01\x00"

    def test_large_integer(self):
        """Large integers (64-bit max)."""
        
        # 0xFFFFFFFFFFFFFFFF (max u64)
        result = Rlp.encode_uint(0xFFFFFFFFFFFFFFFF)
        # 8 bytes + 0x88 prefix
        assert len(result) == 9
        assert result[0] == 0x88
        assert result[1:] == b"\xff" * 8

    def test_negative_integer_raises(self):
        """Negative integers raise ValueError."""
        
        with pytest.raises(ValueError):
            Rlp.encode_uint(-1)


class TestRlpEncode:
    """Tests for Rlp.encode() (high-level API)"""

    def test_encode_bytes(self):
        """Encoding bytes delegates to encode_bytes."""
        
        assert Rlp.encode(b"dog") == b"\x83dog"

    def test_encode_integer(self):
        """Encoding integers delegates to encode_uint."""
        
        assert Rlp.encode(0) == b"\x80"
        assert Rlp.encode(15) == b"\x0f"
        assert Rlp.encode(1024) == b"\x82\x04\x00"

    def test_encode_empty_list(self):
        """Empty list encodes as 0xc0."""
        
        result = Rlp.encode([])
        assert result == b"\xc0"

    def test_encode_list_of_bytes(self):
        """List of bytes encodes items then wraps."""
        
        # ["cat", "dog"]
        result = Rlp.encode([b"cat", b"dog"])
        # Each item: 0x83 + 3 bytes = 4 bytes
        # Total payload: 8 bytes
        # List header: 0xc0 + 8 = 0xc8
        assert result[0] == 0xc8
        assert b"cat" in result
        assert b"dog" in result

    def test_encode_list_of_integers(self):
        """List of integers."""
        
        result = Rlp.encode([1, 2, 3])
        # Each int is 1 byte: 0x01, 0x02, 0x03
        # Payload: 3 bytes, header: 0xc3
        assert result == b"\xc3\x01\x02\x03"

    def test_encode_nested_list(self):
        """Nested lists."""
        
        # [[1, 2], [3, 4]]
        result = Rlp.encode([[1, 2], [3, 4]])
        # [1, 2] = 0xc2 0x01 0x02 (3 bytes)
        # [3, 4] = 0xc2 0x03 0x04 (3 bytes)
        # Outer: 0xc6 + both = 7 bytes total
        assert result == b"\xc6\xc2\x01\x02\xc2\x03\x04"


class TestRlpHexConversion:
    """Tests for Rlp.to_hex() and Rlp.from_hex()"""

    def test_to_hex(self):
        """Convert RLP bytes to hex."""
        
        rlp_data = b"\x83dog"
        result = Rlp.to_hex(rlp_data)
        assert result == "0x83646f67"

    def test_from_hex(self):
        """Convert hex to bytes."""
        
        result = Rlp.from_hex("0x83646f67")
        assert result == b"\x83dog"

    def test_from_hex_no_prefix(self):
        """from_hex works without 0x prefix."""
        
        result = Rlp.from_hex("83646f67")
        assert result == b"\x83dog"

    def test_round_trip(self):
        """to_hex/from_hex round-trip."""
        
        original = b"\xc8\x83cat\x83dog"
        hex_str = Rlp.to_hex(original)
        recovered = Rlp.from_hex(hex_str)
        assert recovered == original


class TestRlpRoundTrip:
    """Round-trip encoding tests."""

    def test_empty_bytes_round_trip(self):
        """Empty bytes encode/decode correctly."""
        
        encoded = Rlp.encode_bytes(b"")
        # Can't decode with current API, just verify encoding
        assert encoded == b"\x80"

    def test_string_round_trip(self):
        """String data round-trips through hex conversion."""
        
        data = b"hello world"
        encoded = Rlp.encode_bytes(data)
        hex_str = Rlp.to_hex(encoded)
        recovered_encoded = Rlp.from_hex(hex_str)
        assert recovered_encoded == encoded

    def test_integer_round_trip(self):
        """Integer encoding round-trips through hex."""
        
        for value in [0, 1, 127, 128, 255, 256, 1024, 65535, 0xFFFFFFFF]:
            encoded = Rlp.encode_uint(value)
            hex_str = Rlp.to_hex(encoded)
            recovered = Rlp.from_hex(hex_str)
            assert recovered == encoded


class TestConvenienceFunction:
    """Tests for rlp_encode() convenience function."""

    def test_rlp_encode(self):
        """rlp_encode is alias for Rlp.encode."""
        
        assert rlp_encode(b"dog") == b"\x83dog"
        assert rlp_encode(42) == b"\x2a"
        assert rlp_encode([1, 2]) == b"\xc2\x01\x02"


class TestEdgeCases:
    """Edge case tests."""

    def test_boundary_0x7f(self):
        """0x7f is the max single-byte value without prefix."""
        
        result = Rlp.encode_bytes(b"\x7f")
        assert result == b"\x7f"

    def test_boundary_0x80(self):
        """0x80 is the min value needing prefix."""
        
        result = Rlp.encode_bytes(b"\x80")
        assert result == b"\x81\x80"

    def test_all_single_bytes_below_0x80(self):
        """All bytes 0x00-0x7f encode as themselves."""
        
        for i in range(0x80):
            result = Rlp.encode_bytes(bytes([i]))
            assert result == bytes([i])

    def test_256_byte_string(self):
        """256 bytes needs 2 length bytes."""
        
        data = b"x" * 256
        result = Rlp.encode_bytes(data)
        # 0xb9 (0xb7 + 2) + 0x01 0x00 (256 in big-endian) + data
        assert result[0] == 0xb9
        assert result[1] == 0x01
        assert result[2] == 0x00
        assert result[3:] == data
