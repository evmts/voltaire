"""Tests for Address module."""

import pytest
from voltaire.address import Address
from voltaire.errors import InvalidHexError, InvalidLengthError


class TestFromHex:
    """Tests for Address.from_hex constructor."""

    def test_from_hex_with_prefix(self):
        """Parse hex string with 0x prefix."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_from_hex_without_prefix(self):
        """Parse hex string without 0x prefix."""
        addr = Address.from_hex("a0cf798816d4b9b9866b5330eea46a18382f251e")
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_from_hex_uppercase(self):
        """Parse uppercase hex string."""
        addr = Address.from_hex("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_from_hex_mixed_case(self):
        """Parse mixed-case (checksummed) hex string."""
        addr = Address.from_hex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_from_hex_invalid_length_short(self):
        """Reject hex strings that are too short."""
        # C API returns InvalidHexError for format issues including length
        with pytest.raises(InvalidHexError):
            Address.from_hex("0x1234")

    def test_from_hex_invalid_length_long(self):
        """Reject hex strings that are too long."""
        # C API returns InvalidHexError for format issues including length
        with pytest.raises(InvalidHexError):
            Address.from_hex("0x" + "a" * 50)

    def test_from_hex_invalid_characters(self):
        """Reject hex strings with invalid characters."""
        with pytest.raises(InvalidHexError):
            Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251g")

    def test_from_hex_odd_length(self):
        """Reject odd-length hex strings."""
        # C API returns InvalidHexError for format issues including length
        with pytest.raises(InvalidHexError):
            Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251")


class TestToHex:
    """Tests for Address.to_hex method."""

    def test_to_hex_returns_lowercase(self):
        """to_hex returns lowercase with 0x prefix."""
        addr = Address.from_hex("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_to_hex_zero_address(self):
        """to_hex works for zero address."""
        addr = Address.zero()
        assert addr.to_hex() == "0x0000000000000000000000000000000000000000"

    def test_to_hex_preserves_leading_zeros(self):
        """to_hex preserves leading zeros."""
        addr = Address.from_hex("0x0000000000000000000000000000000000000001")
        assert addr.to_hex() == "0x0000000000000000000000000000000000000001"


class TestToChecksum:
    """Tests for Address.to_checksum method (EIP-55)."""

    def test_checksum_known_vectors(self):
        """Test known EIP-55 checksum vectors."""
        test_cases = [
            ("0xa0cf798816d4b9b9866b5330eea46a18382f251e", "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"),
            ("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
            ("0x70997970c51812dc3a010c7d01b50e0d17dc79c8", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
        ]
        for input_hex, expected in test_cases:
            addr = Address.from_hex(input_hex)
            assert addr.to_checksum() == expected

    def test_checksum_zero_address(self):
        """Zero address has no letters to checksum."""
        addr = Address.zero()
        assert addr.to_checksum() == "0x0000000000000000000000000000000000000000"


class TestIsZero:
    """Tests for Address.is_zero method."""

    def test_zero_address_is_zero(self):
        """Zero address returns True."""
        assert Address.zero().is_zero()

    def test_non_zero_address_not_zero(self):
        """Non-zero address returns False."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert not addr.is_zero()

    def test_almost_zero_is_not_zero(self):
        """Address with single bit set is not zero."""
        addr = Address.from_hex("0x0000000000000000000000000000000000000001")
        assert not addr.is_zero()


class TestEquals:
    """Tests for Address equality."""

    def test_same_address_equal(self):
        """Same address bytes are equal."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert addr1 == addr2

    def test_different_case_equal(self):
        """Addresses with different case are equal."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_hex("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
        assert addr1 == addr2

    def test_different_address_not_equal(self):
        """Different addresses are not equal."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_hex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
        assert addr1 != addr2

    def test_equal_to_non_address(self):
        """Address is not equal to non-Address types."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert addr != "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
        assert addr != 42
        assert addr != None


class TestValidateChecksum:
    """Tests for Address.validate_checksum static method."""

    def test_valid_checksum(self):
        """Valid checksummed address returns True."""
        assert Address.validate_checksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")
        assert Address.validate_checksum("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
        assert Address.validate_checksum("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")

    def test_all_lowercase_invalid(self):
        """All lowercase is not valid checksum."""
        assert not Address.validate_checksum("0xa0cf798816d4b9b9866b5330eea46a18382f251e")

    def test_all_uppercase_invalid(self):
        """All uppercase is not valid checksum."""
        assert not Address.validate_checksum("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")

    def test_zero_address_valid(self):
        """Zero address (no letters) is valid checksum."""
        assert Address.validate_checksum("0x0000000000000000000000000000000000000000")


class TestFromBytes:
    """Tests for Address.from_bytes constructor."""

    def test_from_bytes_valid(self):
        """Create address from 20 bytes."""
        data = bytes.fromhex("a0cf798816d4b9b9866b5330eea46a18382f251e")
        addr = Address.from_bytes(data)
        assert addr.to_hex() == "0xa0cf798816d4b9b9866b5330eea46a18382f251e"

    def test_from_bytes_too_short(self):
        """Reject bytes that are too short."""
        with pytest.raises(InvalidLengthError):
            Address.from_bytes(b"\x00" * 19)

    def test_from_bytes_too_long(self):
        """Reject bytes that are too long."""
        with pytest.raises(InvalidLengthError):
            Address.from_bytes(b"\x00" * 21)

    def test_from_bytes_empty(self):
        """Reject empty bytes."""
        with pytest.raises(InvalidLengthError):
            Address.from_bytes(b"")


class TestToBytes:
    """Tests for Address.to_bytes method."""

    def test_to_bytes_length(self):
        """to_bytes returns 20 bytes."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert len(addr.to_bytes()) == 20

    def test_to_bytes_roundtrip(self):
        """to_bytes/from_bytes roundtrip preserves address."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_bytes(addr1.to_bytes())
        assert addr1 == addr2

    def test_bytes_builtin(self):
        """bytes() builtin works on Address."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert bytes(addr) == addr.to_bytes()


class TestZero:
    """Tests for Address.zero constructor."""

    def test_zero_creates_null_address(self):
        """zero() creates 20 null bytes."""
        addr = Address.zero()
        assert addr.to_bytes() == b"\x00" * 20

    def test_zero_is_consistent(self):
        """Multiple calls to zero() return equal addresses."""
        assert Address.zero() == Address.zero()


class TestHash:
    """Tests for Address hashability."""

    def test_address_is_hashable(self):
        """Address can be hashed."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        h = hash(addr)
        assert isinstance(h, int)

    def test_equal_addresses_same_hash(self):
        """Equal addresses have same hash."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_hex("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
        assert hash(addr1) == hash(addr2)

    def test_address_in_set(self):
        """Address can be used in sets."""
        addr1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr2 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        addr3 = Address.from_hex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")

        s = {addr1, addr2, addr3}
        assert len(s) == 2

    def test_address_as_dict_key(self):
        """Address can be used as dict key."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        d = {addr: "my_wallet"}
        assert d[addr] == "my_wallet"


class TestRepr:
    """Tests for Address string representation."""

    def test_repr(self):
        """repr shows checksummed address."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        r = repr(addr)
        assert "Address" in r
        assert "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e" in r

    def test_str(self):
        """str returns checksummed address."""
        addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
        assert str(addr) == "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
