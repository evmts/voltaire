"""
RLP (Recursive Length Prefix) encoding for Ethereum.

Provides canonical serialization of bytes, integers, and nested lists.
"""

from __future__ import annotations

from ctypes import c_char_p, c_int, c_size_t, c_uint8, create_string_buffer
from typing import Union

from voltaire._ffi import c_uint8_array_32, get_lib
from voltaire.errors import check_error, InvalidHexError

# Type alias for encodable items
RlpEncodable = Union[bytes, int, list["RlpEncodable"]]


class Rlp:
    """RLP (Recursive Length Prefix) encoding."""

    @staticmethod
    def encode_bytes(data: bytes) -> bytes:
        """
        Encode bytes as RLP.

        Args:
            data: Bytes to encode

        Returns:
            RLP-encoded bytes

        Examples:
            >>> Rlp.encode_bytes(b"dog")
            b'\\x83dog'
            >>> Rlp.encode_bytes(b"")
            b'\\x80'
        """
        lib = get_lib()

        # Output buffer: worst case is prefix + length bytes + data
        # For data up to 2^64, we need at most 9 bytes of header
        buf_size = len(data) + 9
        out_buf = create_string_buffer(buf_size)

        # Convert bytes to ctypes array
        data_array = (c_uint8 * len(data))(*data)

        result = lib.primitives_rlp_encode_bytes(
            data_array,
            c_size_t(len(data)),
            out_buf,
            c_size_t(buf_size),
        )
        check_error(result, "RLP encode bytes")

        return out_buf.raw[:result]

    @staticmethod
    def encode_uint(value: int) -> bytes:
        """
        Encode unsigned integer as RLP.

        Args:
            value: Non-negative integer to encode

        Returns:
            RLP-encoded bytes

        Raises:
            ValueError: If value is negative

        Examples:
            >>> Rlp.encode_uint(0)
            b'\\x80'
            >>> Rlp.encode_uint(1024)
            b'\\x82\\x04\\x00'
        """
        if value < 0:
            raise ValueError("RLP cannot encode negative integers")

        lib = get_lib()

        # Convert integer to 32-byte big-endian
        value_bytes = value.to_bytes(32, byteorder="big")
        value_array = c_uint8_array_32(*value_bytes)

        # Output buffer: max 33 bytes (1 prefix + 32 data)
        buf_size = 33
        out_buf = create_string_buffer(buf_size)

        result = lib.primitives_rlp_encode_uint(
            value_array,
            out_buf,
            c_size_t(buf_size),
        )
        check_error(result, "RLP encode uint")

        return out_buf.raw[:result]

    @staticmethod
    def encode(item: RlpEncodable) -> bytes:
        """
        Encode item as RLP (recursive for lists).

        Args:
            item: Bytes, integer, or list of encodable items

        Returns:
            RLP-encoded bytes

        Examples:
            >>> Rlp.encode(b"hello")
            b'\\x85hello'
            >>> Rlp.encode([1, 2, 3])
            b'\\xc3\\x01\\x02\\x03'
        """
        if isinstance(item, bytes):
            return Rlp.encode_bytes(item)
        elif isinstance(item, int):
            return Rlp.encode_uint(item)
        elif isinstance(item, list):
            return Rlp._encode_list(item)
        else:
            raise TypeError(f"Cannot RLP encode type: {type(item).__name__}")

    @staticmethod
    def _encode_list(items: list[RlpEncodable]) -> bytes:
        """
        Encode list as RLP.

        Args:
            items: List of encodable items

        Returns:
            RLP-encoded list
        """
        # Encode each item
        encoded_items = b"".join(Rlp.encode(item) for item in items)
        payload_len = len(encoded_items)

        if payload_len < 56:
            # Short list: 0xc0 + len prefix
            return bytes([0xc0 + payload_len]) + encoded_items
        else:
            # Long list: 0xf7 + len(len) prefix + length + items
            len_bytes = Rlp._encode_length(payload_len)
            return bytes([0xf7 + len(len_bytes)]) + len_bytes + encoded_items

    @staticmethod
    def _encode_length(length: int) -> bytes:
        """Encode length as minimal big-endian bytes."""
        if length == 0:
            return b""
        result = []
        while length > 0:
            result.insert(0, length & 0xFF)
            length >>= 8
        return bytes(result)

    @staticmethod
    def to_hex(rlp_data: bytes) -> str:
        """
        Convert RLP bytes to hex string.

        Args:
            rlp_data: RLP-encoded bytes

        Returns:
            Hex string with 0x prefix

        Example:
            >>> Rlp.to_hex(b"\\x83dog")
            '0x83646f67'
        """
        lib = get_lib()

        # Output: 2 (0x) + 2*len + 1 (null)
        buf_size = 2 + 2 * len(rlp_data) + 1
        out_buf = create_string_buffer(buf_size)

        data_array = (c_uint8 * len(rlp_data))(*rlp_data)

        result = lib.primitives_rlp_to_hex(
            data_array,
            c_size_t(len(rlp_data)),
            out_buf,
            c_size_t(buf_size),
        )
        check_error(result, "RLP to hex")

        return out_buf.value.decode("ascii")

    @staticmethod
    def from_hex(hex_str: str) -> bytes:
        """
        Convert hex string to bytes.

        Args:
            hex_str: Hex string (with or without 0x prefix)

        Returns:
            Decoded bytes

        Raises:
            InvalidHexError: If string contains invalid hex characters

        Example:
            >>> Rlp.from_hex("0x83646f67")
            b'\\x83dog'
        """
        lib = get_lib()

        # Normalize: ensure 0x prefix for C API
        if not hex_str.startswith("0x") and not hex_str.startswith("0X"):
            hex_str = "0x" + hex_str

        # Output buffer: (len - 2) / 2 bytes
        hex_len = len(hex_str)
        buf_size = (hex_len - 2) // 2 + 1
        out_buf = create_string_buffer(buf_size)

        result = lib.primitives_rlp_from_hex(
            hex_str.encode("ascii"),
            out_buf,
            c_size_t(buf_size),
        )
        check_error(result, "RLP from hex")

        return out_buf.raw[:result]


def rlp_encode(item: RlpEncodable) -> bytes:
    """
    Encode item as RLP.

    Convenience function, alias for Rlp.encode().

    Args:
        item: Bytes, integer, or list of encodable items

    Returns:
        RLP-encoded bytes
    """
    return Rlp.encode(item)
