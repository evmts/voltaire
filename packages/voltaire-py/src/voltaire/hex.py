"""
Hex encoding/decoding utilities.

Provides efficient hex string encoding/decoding using Voltaire's native C implementation.
"""

import ctypes
from ctypes import c_char_p, c_size_t, create_string_buffer

from voltaire._ffi import get_lib, c_uint8_p
from voltaire.errors import check_error, InvalidHexError, InvalidLengthError


class Hex:
    """Hex encoding/decoding utilities."""

    @staticmethod
    def encode(data: bytes) -> str:
        """
        Encode bytes to hex string with 0x prefix.

        Args:
            data: Bytes to encode

        Returns:
            Hex string with 0x prefix (lowercase)

        Example:
            >>> Hex.encode(b"\\xde\\xad\\xbe\\xef")
            '0xdeadbeef'
        """
        if len(data) == 0:
            return "0x"

        lib = get_lib()

        # Output buffer: "0x" + 2 chars per byte + null terminator
        out_len = 2 + len(data) * 2 + 1
        out_buf = create_string_buffer(out_len)

        # Convert bytes to c_uint8 array
        data_arr = (ctypes.c_uint8 * len(data))(*data)
        data_ptr = ctypes.cast(data_arr, c_uint8_p)

        result = lib.primitives_bytes_to_hex(
            data_ptr,
            c_size_t(len(data)),
            out_buf,
            c_size_t(out_len),
        )

        check_error(result, "Hex.encode")

        return out_buf.value.decode("ascii")

    @staticmethod
    def decode(hex_str: str) -> bytes:
        """
        Decode hex string to bytes.

        Args:
            hex_str: Hex string (with or without 0x prefix)

        Returns:
            Decoded bytes

        Raises:
            InvalidHexError: If the string contains invalid hex characters
            InvalidLengthError: If the string has odd length

        Example:
            >>> Hex.decode("0xdeadbeef")
            b'\\xde\\xad\\xbe\\xef'
        """
        # Handle empty cases
        if hex_str == "" or hex_str == "0x":
            return b""

        # Normalize: ensure 0x prefix (C API requires it)
        if hex_str.startswith("0x") or hex_str.startswith("0X"):
            normalized = "0x" + hex_str[2:]  # Normalize to lowercase prefix
        else:
            normalized = "0x" + hex_str

        # Check for odd length (must be even for valid hex after prefix)
        hex_digits = normalized[2:]
        if len(hex_digits) % 2 != 0:
            raise InvalidLengthError("Hex string must have even length")

        if len(hex_digits) == 0:
            return b""

        lib = get_lib()

        # Output buffer: 1 byte per 2 hex chars
        out_len = len(hex_digits) // 2
        out_buf = (ctypes.c_uint8 * out_len)()
        out_ptr = ctypes.cast(out_buf, c_uint8_p)

        # Pass hex string (with 0x prefix) as null-terminated
        hex_bytes = normalized.encode("ascii")

        result = lib.primitives_hex_to_bytes(
            c_char_p(hex_bytes),
            out_ptr,
            c_size_t(out_len),
        )

        check_error(result, "Hex.decode")

        return bytes(out_buf)

    @staticmethod
    def is_valid(hex_str: str) -> bool:
        """
        Check if string is valid hexadecimal.

        Args:
            hex_str: String to validate

        Returns:
            True if valid hex, False otherwise

        Example:
            >>> Hex.is_valid("0xdeadbeef")
            True
            >>> Hex.is_valid("0xgg")
            False
        """
        try:
            Hex.decode(hex_str)
            return True
        except (InvalidHexError, InvalidLengthError):
            return False


def hex_encode(data: bytes) -> str:
    """
    Encode bytes to hex string with 0x prefix.

    Alias for Hex.encode().

    Args:
        data: Bytes to encode

    Returns:
        Hex string with 0x prefix

    Example:
        >>> hex_encode(b"\\xca\\xfe")
        '0xcafe'
    """
    return Hex.encode(data)


def hex_decode(hex_str: str) -> bytes:
    """
    Decode hex string to bytes.

    Alias for Hex.decode().

    Args:
        hex_str: Hex string (with or without 0x prefix)

    Returns:
        Decoded bytes

    Example:
        >>> hex_decode("0xcafe")
        b'\\xca\\xfe'
    """
    return Hex.decode(hex_str)
