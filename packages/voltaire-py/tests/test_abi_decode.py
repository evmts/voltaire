"""Tests for ABI decoding module."""

import pytest

from voltaire.abi import Abi
from voltaire.errors import InvalidInputError, InvalidLengthError


class TestDecodeParametersUint:
    """Tests for decoding uint types."""

    def test_decode_uint8(self):
        """Decode uint8 value."""
        data = bytes(31) + bytes([42])
        values = Abi.decode_parameters(["uint8"], data)
        assert values == [42]

    def test_decode_uint8_zero(self):
        """Decode uint8 zero."""
        data = bytes(32)
        values = Abi.decode_parameters(["uint8"], data)
        assert values == [0]

    def test_decode_uint8_max(self):
        """Decode uint8 max (255)."""
        data = bytes(31) + bytes([255])
        values = Abi.decode_parameters(["uint8"], data)
        assert values == [255]

    def test_decode_uint16(self):
        """Decode uint16 value."""
        data = bytes(30) + bytes([0x04, 0xd2])  # 1234
        values = Abi.decode_parameters(["uint16"], data)
        assert values == [1234]

    def test_decode_uint32(self):
        """Decode uint32 value."""
        data = bytes(28) + bytes([0x07, 0x5b, 0xcd, 0x15])  # 123456789
        values = Abi.decode_parameters(["uint32"], data)
        assert values == [123456789]

    def test_decode_uint64(self):
        """Decode uint64 value."""
        # 0x123456789abcdef0
        data = bytes(24) + bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])
        values = Abi.decode_parameters(["uint64"], data)
        assert values == [0x123456789abcdef0]

    def test_decode_uint256_zero(self):
        """Decode uint256 zero."""
        data = bytes(32)
        values = Abi.decode_parameters(["uint256"], data)
        assert values == [0]

    def test_decode_uint256_max(self):
        """Decode uint256 max value."""
        data = bytes([0xff] * 32)
        values = Abi.decode_parameters(["uint256"], data)
        max_uint256 = 2**256 - 1
        assert values == [max_uint256]

    def test_decode_multiple_uint_values(self):
        """Decode multiple uint values."""
        data = bytes(31) + bytes([1]) + bytes(31) + bytes([2]) + bytes(31) + bytes([3])
        values = Abi.decode_parameters(["uint8", "uint16", "uint256"], data)
        assert values == [1, 2, 3]


class TestDecodeParametersInt:
    """Tests for decoding int (signed) types."""

    def test_decode_int8_zero(self):
        """Decode int8 zero."""
        data = bytes(32)
        values = Abi.decode_parameters(["int8"], data)
        assert values == [0]

    def test_decode_int8_positive(self):
        """Decode int8 positive (127)."""
        data = bytes(31) + bytes([127])
        values = Abi.decode_parameters(["int8"], data)
        assert values == [127]

    def test_decode_int8_negative(self):
        """Decode int8 negative (-1)."""
        data = bytes([0xff] * 32)
        values = Abi.decode_parameters(["int8"], data)
        assert values == [-1]

    def test_decode_int8_min(self):
        """Decode int8 min (-128)."""
        data = bytes([0xff] * 31) + bytes([0x80])
        values = Abi.decode_parameters(["int8"], data)
        assert values == [-128]

    def test_decode_int128_positive(self):
        """Decode int128 positive."""
        data = bytes(31) + bytes([42])
        values = Abi.decode_parameters(["int128"], data)
        assert values == [42]

    def test_decode_int128_negative(self):
        """Decode int128 negative (-42)."""
        # Two's complement of -42 in 256 bits
        neg_42 = (2**256 - 42).to_bytes(32, "big")
        values = Abi.decode_parameters(["int128"], neg_42)
        assert values == [-42]

    @pytest.mark.skip(reason="int256 not natively supported in Zig")
    def test_decode_int256_positive(self):
        """Decode int256 positive."""
        data = bytes(31) + bytes([42])
        values = Abi.decode_parameters(["int256"], data)
        assert values == [42]

    @pytest.mark.skip(reason="int256 not natively supported in Zig")
    def test_decode_int256_negative(self):
        """Decode int256 negative (-42)."""
        # Two's complement of -42 in 256 bits
        neg_42 = (2**256 - 42).to_bytes(32, "big")
        values = Abi.decode_parameters(["int256"], neg_42)
        assert values == [-42]


class TestDecodeParametersAddress:
    """Tests for decoding address type."""

    def test_decode_zero_address(self):
        """Decode zero address."""
        data = bytes(32)
        values = Abi.decode_parameters(["address"], data)
        assert values[0] == "0x0000000000000000000000000000000000000000"

    def test_decode_specific_address(self):
        """Decode specific address."""
        addr_bytes = bytes.fromhex("742d35cc6634c0532925a3b844bc9e7595f251e3")
        data = bytes(12) + addr_bytes
        values = Abi.decode_parameters(["address"], data)
        assert values[0].lower() == "0x742d35cc6634c0532925a3b844bc9e7595f251e3"

    def test_decode_multiple_addresses(self):
        """Decode multiple addresses."""
        addr1 = bytes(12) + bytes.fromhex("0000000000000000000000000000000000000001")
        addr2 = bytes(12) + bytes.fromhex("0000000000000000000000000000000000000002")
        data = addr1 + addr2
        values = Abi.decode_parameters(["address", "address"], data)
        assert len(values) == 2
        assert values[0] == "0x0000000000000000000000000000000000000001"
        assert values[1] == "0x0000000000000000000000000000000000000002"


class TestDecodeParametersBool:
    """Tests for decoding bool type."""

    def test_decode_true(self):
        """Decode true."""
        data = bytes(31) + bytes([1])
        values = Abi.decode_parameters(["bool"], data)
        assert values == [True]

    def test_decode_false(self):
        """Decode false."""
        data = bytes(32)
        values = Abi.decode_parameters(["bool"], data)
        assert values == [False]

    def test_decode_multiple_bools(self):
        """Decode multiple bools."""
        data = bytes(31) + bytes([1]) + bytes(32) + bytes(31) + bytes([1])
        values = Abi.decode_parameters(["bool", "bool", "bool"], data)
        assert values == [True, False, True]


class TestDecodeParametersFixedBytes:
    """Tests for decoding fixed bytes types."""

    def test_decode_bytes4(self):
        """Decode bytes4."""
        data = bytes([0x12, 0x34, 0x56, 0x78]) + bytes(28)
        values = Abi.decode_parameters(["bytes4"], data)
        assert values[0] == bytes([0x12, 0x34, 0x56, 0x78])

    def test_decode_bytes32(self):
        """Decode bytes32."""
        data = bytes([0xff] * 32)
        values = Abi.decode_parameters(["bytes32"], data)
        assert values[0] == bytes([0xff] * 32)


class TestDecodeParametersDynamic:
    """Tests for decoding dynamic types."""

    def test_decode_empty_bytes(self):
        """Decode empty bytes."""
        # Offset to data (32), then length (0)
        data = bytes(31) + bytes([0x20]) + bytes(32)
        values = Abi.decode_parameters(["bytes"], data)
        assert values[0] == b""

    def test_decode_bytes_with_data(self):
        """Decode bytes with data."""
        # Offset (32), length (8), data (0x123456789abcdef0) + padding
        data = (
            bytes(31) + bytes([0x20])  # offset = 32
            + bytes(31) + bytes([0x08])  # length = 8
            + bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]) + bytes(24)  # data + padding
        )
        values = Abi.decode_parameters(["bytes"], data)
        assert values[0] == bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])

    def test_decode_empty_string(self):
        """Decode empty string."""
        data = bytes(31) + bytes([0x20]) + bytes(32)
        values = Abi.decode_parameters(["string"], data)
        assert values[0] == ""

    def test_decode_string(self):
        """Decode string 'hello'."""
        # Offset (32), length (5), "hello" + padding
        data = (
            bytes(31) + bytes([0x20])  # offset = 32
            + bytes(31) + bytes([0x05])  # length = 5
            + b"hello" + bytes(27)  # data + padding
        )
        values = Abi.decode_parameters(["string"], data)
        assert values[0] == "hello"


class TestDecodeParametersArrays:
    """Tests for decoding array types."""

    def test_decode_empty_uint256_array(self):
        """Decode empty uint256[]."""
        # Offset (32), length (0)
        data = bytes(31) + bytes([0x20]) + bytes(32)
        values = Abi.decode_parameters(["uint256[]"], data)
        assert values[0] == []

    def test_decode_uint256_array(self):
        """Decode uint256[] with elements."""
        # Offset (32), length (3), elements (1, 2, 3)
        data = (
            bytes(31) + bytes([0x20])  # offset = 32
            + bytes(31) + bytes([0x03])  # length = 3
            + bytes(31) + bytes([0x01])  # element 0 = 1
            + bytes(31) + bytes([0x02])  # element 1 = 2
            + bytes(31) + bytes([0x03])  # element 2 = 3
        )
        values = Abi.decode_parameters(["uint256[]"], data)
        assert values[0] == [1, 2, 3]


class TestDecodeParametersMixed:
    """Tests for decoding mixed static/dynamic types."""

    def test_decode_uint256_and_string(self):
        """Decode uint256 followed by string."""
        # uint256 (42), offset for string, string length, string data
        data = (
            bytes(31) + bytes([0x2a])  # uint256 = 42
            + bytes(31) + bytes([0x40])  # offset = 64
            + bytes(31) + bytes([0x05])  # length = 5
            + b"hello" + bytes(27)  # data + padding
        )
        values = Abi.decode_parameters(["uint256", "string"], data)
        assert values[0] == 42
        assert values[1] == "hello"


class TestDecodeParametersEdgeCases:
    """Tests for edge cases."""

    def test_decode_empty_params(self):
        """Decode empty parameter list."""
        values = Abi.decode_parameters([], b"")
        assert values == []

    def test_decode_truncated_data_raises(self):
        """Truncated data raises error."""
        with pytest.raises((InvalidInputError, InvalidLengthError)):
            Abi.decode_parameters(["uint256"], bytes(16))

    def test_decode_empty_data_for_params_raises(self):
        """Empty data for non-empty params raises error."""
        with pytest.raises((InvalidInputError, InvalidLengthError)):
            Abi.decode_parameters(["uint256"], b"")


class TestDecodeFunctionData:
    """Tests for decode_function_data."""

    def test_decode_transfer(self):
        """Decode transfer(address,uint256) calldata."""
        # selector: a9059cbb
        # to: 0x742d35cc6634c0532925a3b844bc9e7595f251e3
        # amount: 1000 (0x3e8)
        addr_bytes = bytes.fromhex("742d35cc6634c0532925a3b844bc9e7595f251e3")
        data = (
            bytes.fromhex("a9059cbb")
            + bytes(12) + addr_bytes
            + bytes(30) + bytes([0x03, 0xe8])  # 1000 = 0x3e8 (30 zero bytes + 2 bytes)
        )
        selector, values = Abi.decode_function_data(["address", "uint256"], data)
        assert selector == bytes.fromhex("a9059cbb")
        assert values[0].lower() == "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
        assert values[1] == 1000

    def test_decode_no_params(self):
        """Decode function with no parameters."""
        data = bytes.fromhex("18160ddd")  # totalSupply()
        selector, values = Abi.decode_function_data([], data)
        assert selector == bytes.fromhex("18160ddd")
        assert values == []

    def test_decode_short_data_raises(self):
        """Data too short for selector raises error."""
        with pytest.raises((InvalidInputError, InvalidLengthError)):
            Abi.decode_function_data(["uint256"], bytes([0xa9, 0x05, 0x9c]))

    def test_decode_empty_data_raises(self):
        """Empty data raises error."""
        with pytest.raises((InvalidInputError, InvalidLengthError)):
            Abi.decode_function_data(["uint256"], b"")


class TestComputeSelector:
    """Tests for compute_selector."""

    def test_transfer_selector(self):
        """ERC20 transfer selector."""
        selector = Abi.compute_selector("transfer(address,uint256)")
        assert selector == bytes.fromhex("a9059cbb")

    def test_balance_of_selector(self):
        """ERC20 balanceOf selector."""
        selector = Abi.compute_selector("balanceOf(address)")
        assert selector == bytes.fromhex("70a08231")

    def test_approve_selector(self):
        """ERC20 approve selector."""
        selector = Abi.compute_selector("approve(address,uint256)")
        assert selector == bytes.fromhex("095ea7b3")


class TestRoundTrip:
    """Round-trip encoding/decoding tests (using known encoded data)."""

    def test_roundtrip_uint256(self):
        """Round-trip uint256."""
        # Known encoding of 42
        data = bytes(31) + bytes([0x2a])
        values = Abi.decode_parameters(["uint256"], data)
        assert values == [42]

    def test_roundtrip_address(self):
        """Round-trip address."""
        addr = "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
        addr_bytes = bytes.fromhex(addr[2:])
        data = bytes(12) + addr_bytes
        values = Abi.decode_parameters(["address"], data)
        assert values[0].lower() == addr.lower()
