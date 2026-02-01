"""Tests for Hex module."""

import pytest
from voltaire.hex import Hex, hex_encode, hex_decode
from voltaire.errors import InvalidHexError, InvalidLengthError


class TestEncode:
    """Tests for Hex.encode."""

    def test_encode_basic(self):
        """Encode bytes to hex string."""
        result = Hex.encode(b"\xde\xad\xbe\xef")
        assert result == "0xdeadbeef"

    def test_encode_empty(self):
        """Encode empty bytes returns 0x."""
        result = Hex.encode(b"")
        assert result == "0x"

    def test_encode_single_byte(self):
        """Encode single byte."""
        result = Hex.encode(b"\xff")
        assert result == "0xff"

    def test_encode_leading_zeros(self):
        """Encode preserves leading zeros."""
        result = Hex.encode(b"\x00\x00\xff")
        assert result == "0x0000ff"

    def test_encode_all_zeros(self):
        """Encode all zero bytes."""
        result = Hex.encode(b"\x00\x00\x00")
        assert result == "0x000000"

    def test_encode_large_data(self):
        """Encode larger byte sequences."""
        data = bytes(range(256))
        result = Hex.encode(data)
        assert result.startswith("0x")
        assert len(result) == 2 + 512  # 0x + 2 chars per byte

    def test_encode_returns_lowercase(self):
        """Encode returns lowercase hex."""
        result = Hex.encode(b"\xAB\xCD\xEF")
        assert result == "0xabcdef"
        assert result.islower() or result == "0x"


class TestDecode:
    """Tests for Hex.decode."""

    def test_decode_with_prefix(self):
        """Decode hex string with 0x prefix."""
        result = Hex.decode("0xdeadbeef")
        assert result == b"\xde\xad\xbe\xef"

    def test_decode_without_prefix(self):
        """Decode hex string without 0x prefix."""
        result = Hex.decode("deadbeef")
        assert result == b"\xde\xad\xbe\xef"

    def test_decode_uppercase(self):
        """Decode uppercase hex."""
        result = Hex.decode("0xDEADBEEF")
        assert result == b"\xde\xad\xbe\xef"

    def test_decode_mixed_case(self):
        """Decode mixed-case hex."""
        result = Hex.decode("0xDeAdBeEf")
        assert result == b"\xde\xad\xbe\xef"

    def test_decode_empty_with_prefix(self):
        """Decode 0x returns empty bytes."""
        result = Hex.decode("0x")
        assert result == b""

    def test_decode_empty_without_prefix(self):
        """Decode empty string returns empty bytes."""
        result = Hex.decode("")
        assert result == b""

    def test_decode_leading_zeros(self):
        """Decode preserves leading zeros."""
        result = Hex.decode("0x0000ff")
        assert result == b"\x00\x00\xff"

    def test_decode_single_byte(self):
        """Decode single byte."""
        result = Hex.decode("0xff")
        assert result == b"\xff"

    def test_decode_invalid_chars(self):
        """Reject hex with invalid characters."""
        with pytest.raises(InvalidHexError):
            Hex.decode("0xgg")

    def test_decode_invalid_chars_no_prefix(self):
        """Reject hex with invalid characters (no prefix)."""
        with pytest.raises(InvalidHexError):
            Hex.decode("zzzz")

    def test_decode_odd_length(self):
        """Reject odd-length hex string."""
        with pytest.raises((InvalidHexError, InvalidLengthError)):
            Hex.decode("0x123")

    def test_decode_odd_length_no_prefix(self):
        """Reject odd-length hex string without prefix."""
        with pytest.raises((InvalidHexError, InvalidLengthError)):
            Hex.decode("123")

    def test_decode_non_hex_chars(self):
        """Reject strings with non-hex characters."""
        # May raise InvalidHexError or InvalidLengthError depending on check order
        with pytest.raises((InvalidHexError, InvalidLengthError)):
            Hex.decode("0xhello")

    def test_decode_spaces(self):
        """Reject hex with spaces."""
        # May raise InvalidHexError or InvalidLengthError depending on check order
        with pytest.raises((InvalidHexError, InvalidLengthError)):
            Hex.decode("0xde ad be ef")


class TestRoundTrip:
    """Tests for encode/decode round-trip."""

    def test_roundtrip_basic(self):
        """Encode then decode returns original bytes."""
        original = b"\xde\xad\xbe\xef"
        encoded = Hex.encode(original)
        decoded = Hex.decode(encoded)
        assert decoded == original

    def test_roundtrip_empty(self):
        """Round-trip empty bytes."""
        original = b""
        encoded = Hex.encode(original)
        decoded = Hex.decode(encoded)
        assert decoded == original

    def test_roundtrip_all_bytes(self):
        """Round-trip all possible byte values."""
        original = bytes(range(256))
        encoded = Hex.encode(original)
        decoded = Hex.decode(encoded)
        assert decoded == original

    def test_roundtrip_zeros(self):
        """Round-trip zero bytes."""
        original = b"\x00" * 32
        encoded = Hex.encode(original)
        decoded = Hex.decode(encoded)
        assert decoded == original


class TestIsValid:
    """Tests for Hex.is_valid."""

    def test_valid_with_prefix(self):
        """Valid hex with 0x prefix."""
        assert Hex.is_valid("0xdeadbeef")

    def test_valid_without_prefix(self):
        """Valid hex without prefix."""
        assert Hex.is_valid("deadbeef")

    def test_valid_empty_with_prefix(self):
        """0x is valid."""
        assert Hex.is_valid("0x")

    def test_valid_empty(self):
        """Empty string is valid."""
        assert Hex.is_valid("")

    def test_valid_uppercase(self):
        """Uppercase hex is valid."""
        assert Hex.is_valid("0xABCDEF")

    def test_valid_mixed_case(self):
        """Mixed-case hex is valid."""
        assert Hex.is_valid("0xAbCdEf")

    def test_invalid_chars(self):
        """Invalid characters return False."""
        assert not Hex.is_valid("0xgg")

    def test_invalid_odd_length(self):
        """Odd-length hex is invalid."""
        assert not Hex.is_valid("0x123")

    def test_invalid_not_hex(self):
        """Non-hex string is invalid."""
        assert not Hex.is_valid("hello")

    def test_invalid_spaces(self):
        """Hex with spaces is invalid."""
        assert not Hex.is_valid("0xde ad")

    def test_invalid_special_chars(self):
        """Hex with special chars is invalid."""
        assert not Hex.is_valid("0x123!")


class TestConvenienceFunctions:
    """Tests for hex_encode and hex_decode convenience functions."""

    def test_hex_encode(self):
        """hex_encode works like Hex.encode."""
        assert hex_encode(b"\xca\xfe") == "0xcafe"

    def test_hex_decode(self):
        """hex_decode works like Hex.decode."""
        assert hex_decode("0xcafe") == b"\xca\xfe"

    def test_hex_decode_no_prefix(self):
        """hex_decode handles strings without prefix."""
        assert hex_decode("cafe") == b"\xca\xfe"
