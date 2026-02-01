"""Tests for Uint256 module."""

import pytest
from voltaire import Uint256, InvalidHexError, InvalidLengthError


class TestFromHex:
    """Test Uint256.from_hex()."""

    def test_from_hex_with_prefix(self):
        value = Uint256.from_hex("0x1234")
        assert int(value) == 0x1234

    def test_from_hex_without_prefix(self):
        value = Uint256.from_hex("ff")
        assert int(value) == 255

    def test_from_hex_full_width(self):
        hex_str = "0x" + "ff" * 32
        value = Uint256.from_hex(hex_str)
        assert int(value) == 2**256 - 1

    def test_from_hex_zero(self):
        value = Uint256.from_hex("0x0")
        assert int(value) == 0

    def test_from_hex_leading_zeros(self):
        value = Uint256.from_hex("0x0000000000000000000000000000000000000000000000000000000000001234")
        assert int(value) == 0x1234

    def test_from_hex_case_insensitive(self):
        lower = Uint256.from_hex("0xabcdef")
        upper = Uint256.from_hex("0xABCDEF")
        assert lower == upper

    def test_from_hex_invalid_chars(self):
        with pytest.raises(InvalidHexError):
            Uint256.from_hex("0xgggg")

    def test_from_hex_too_long(self):
        # 33 bytes = 66 hex chars, exceeds 32 bytes
        # C API returns InvalidHexError for overlong inputs
        hex_str = "0x" + "ff" * 33
        with pytest.raises(InvalidHexError):
            Uint256.from_hex(hex_str)


class TestFromInt:
    """Test Uint256.from_int()."""

    def test_from_int_zero(self):
        value = Uint256.from_int(0)
        assert int(value) == 0

    def test_from_int_small(self):
        value = Uint256.from_int(42)
        assert int(value) == 42

    def test_from_int_large(self):
        value = Uint256.from_int(10**18)
        assert int(value) == 10**18

    def test_from_int_max(self):
        max_val = 2**256 - 1
        value = Uint256.from_int(max_val)
        assert int(value) == max_val

    def test_from_int_negative_raises(self):
        with pytest.raises(ValueError):
            Uint256.from_int(-1)

    def test_from_int_overflow_raises(self):
        with pytest.raises(ValueError):
            Uint256.from_int(2**256)

    def test_from_int_way_over_max_raises(self):
        with pytest.raises(ValueError):
            Uint256.from_int(2**512)


class TestFromBytes:
    """Test Uint256.from_bytes()."""

    def test_from_bytes_full_width(self):
        data = b'\x00' * 31 + b'\x01'
        value = Uint256.from_bytes(data)
        assert int(value) == 1

    def test_from_bytes_max_value(self):
        data = b'\xff' * 32
        value = Uint256.from_bytes(data)
        assert int(value) == 2**256 - 1

    def test_from_bytes_short_pads(self):
        # Short bytes should be left-padded with zeros
        data = b'\x01\x00'  # 256 in big-endian
        value = Uint256.from_bytes(data)
        assert int(value) == 256

    def test_from_bytes_empty(self):
        value = Uint256.from_bytes(b'')
        assert int(value) == 0

    def test_from_bytes_too_long(self):
        data = b'\xff' * 33
        with pytest.raises(InvalidLengthError):
            Uint256.from_bytes(data)


class TestToHex:
    """Test Uint256.to_hex()."""

    def test_to_hex_zero_padded(self):
        value = Uint256.from_int(255)
        hex_str = value.to_hex()
        assert hex_str.startswith("0x")
        # Should be 0x + 64 hex chars (32 bytes)
        assert len(hex_str) == 66
        assert hex_str.endswith("ff")

    def test_to_hex_zero(self):
        value = Uint256.zero()
        hex_str = value.to_hex()
        assert hex_str == "0x" + "00" * 32

    def test_to_hex_max(self):
        value = Uint256.from_int(2**256 - 1)
        hex_str = value.to_hex()
        assert hex_str == "0x" + "ff" * 32


class TestToInt:
    """Test Uint256.to_int()."""

    def test_to_int_roundtrip(self):
        original = 123456789
        value = Uint256.from_int(original)
        assert value.to_int() == original

    def test_to_int_zero(self):
        value = Uint256.zero()
        assert value.to_int() == 0

    def test_to_int_max(self):
        value = Uint256.from_int(2**256 - 1)
        assert value.to_int() == 2**256 - 1


class TestToBytes:
    """Test Uint256.to_bytes()."""

    def test_to_bytes_length(self):
        value = Uint256.from_int(42)
        data = value.to_bytes()
        assert len(data) == 32

    def test_to_bytes_big_endian(self):
        value = Uint256.from_int(256)  # 0x100
        data = value.to_bytes()
        # Big-endian: most significant byte first
        assert data[-2] == 1
        assert data[-1] == 0

    def test_to_bytes_roundtrip(self):
        original = b'\x12\x34\x56\x78' + b'\x00' * 28
        value = Uint256.from_bytes(original)
        assert value.to_bytes() == original


class TestZero:
    """Test Uint256.zero()."""

    def test_zero_is_zero(self):
        zero = Uint256.zero()
        assert int(zero) == 0

    def test_zero_to_hex(self):
        zero = Uint256.zero()
        assert zero.to_hex() == "0x" + "00" * 32

    def test_zero_to_bytes(self):
        zero = Uint256.zero()
        assert zero.to_bytes() == b'\x00' * 32


class TestMaxConstant:
    """Test Uint256.MAX constant."""

    def test_max_value(self):
        assert Uint256.MAX == 2**256 - 1


class TestPythonProtocols:
    """Test Python protocol support."""

    def test_int_conversion(self):
        value = Uint256.from_int(42)
        assert int(value) == 42

    def test_equality(self):
        a = Uint256.from_int(100)
        b = Uint256.from_hex("0x64")
        assert a == b

    def test_equality_different_values(self):
        a = Uint256.from_int(100)
        b = Uint256.from_int(200)
        assert a != b

    def test_equality_with_non_uint256(self):
        value = Uint256.from_int(100)
        assert value != 100
        assert value != "100"
        assert value != None

    def test_less_than(self):
        a = Uint256.from_int(100)
        b = Uint256.from_int(200)
        assert a < b
        assert not b < a

    def test_less_than_or_equal(self):
        a = Uint256.from_int(100)
        b = Uint256.from_int(100)
        c = Uint256.from_int(200)
        assert a <= b
        assert a <= c
        assert not c <= a

    def test_greater_than(self):
        a = Uint256.from_int(200)
        b = Uint256.from_int(100)
        assert a > b
        assert not b > a

    def test_greater_than_or_equal(self):
        a = Uint256.from_int(100)
        b = Uint256.from_int(100)
        c = Uint256.from_int(50)
        assert a >= b
        assert a >= c
        assert not c >= a

    def test_hash(self):
        value = Uint256.from_int(42)
        # Should be hashable
        hash(value)
        # Same value should have same hash
        value2 = Uint256.from_int(42)
        assert hash(value) == hash(value2)

    def test_usable_in_set(self):
        a = Uint256.from_int(100)
        b = Uint256.from_int(100)
        c = Uint256.from_int(200)
        s = {a, b, c}
        assert len(s) == 2  # a and b are equal

    def test_usable_as_dict_key(self):
        value = Uint256.from_int(42)
        d = {value: "test"}
        assert d[Uint256.from_int(42)] == "test"

    def test_repr(self):
        value = Uint256.from_int(255)
        r = repr(value)
        assert "Uint256" in r
        assert "ff" in r.lower()

    def test_str(self):
        value = Uint256.from_int(255)
        s = str(value)
        assert s.startswith("0x")
        assert "ff" in s.lower()
