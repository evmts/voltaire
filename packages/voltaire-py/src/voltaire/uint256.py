"""
Uint256 - 256-bit unsigned integer for Ethereum values.

Big-endian byte representation matching Ethereum ABI encoding.
"""

from __future__ import annotations

import ctypes
from typing import TYPE_CHECKING

from voltaire._ffi import PrimitivesU256, get_lib
from voltaire.errors import InvalidLengthError, check_error

if TYPE_CHECKING:
    from typing import Self


class Uint256:
    """256-bit unsigned integer."""

    MAX = (1 << 256) - 1

    __slots__ = ("_data",)

    def __init__(self, data: bytes) -> None:
        """
        Internal constructor. Use from_hex, from_int, or from_bytes instead.

        Args:
            data: Raw 32-byte big-endian representation.
        """
        if len(data) != 32:
            raise InvalidLengthError(f"Expected 32 bytes, got {len(data)}")
        self._data = data

    @classmethod
    def from_hex(cls, hex_str: str) -> Self:
        """
        Create from hex string.

        Args:
            hex_str: Hex string with optional 0x prefix.

        Returns:
            Uint256 instance.

        Raises:
            InvalidHexError: Invalid hex characters.
            InvalidLengthError: Exceeds 32 bytes.
        """
        lib = get_lib()
        result = PrimitivesU256()

        # Encode to bytes for C API
        if not hex_str.startswith("0x") and not hex_str.startswith("0X"):
            hex_str = "0x" + hex_str
        hex_bytes = hex_str.encode("ascii")

        code = lib.primitives_u256_from_hex(hex_bytes, ctypes.byref(result))
        check_error(code, "Uint256.from_hex")

        return cls(bytes(result.bytes))

    @classmethod
    def from_int(cls, value: int) -> Self:
        """
        Create from Python integer.

        Args:
            value: Non-negative integer <= 2^256 - 1.

        Returns:
            Uint256 instance.

        Raises:
            ValueError: Negative or exceeds maximum.
        """
        if value < 0:
            raise ValueError(f"Uint256 cannot be negative: {value}")
        if value > cls.MAX:
            raise ValueError(f"Value exceeds Uint256.MAX: {value}")

        # Convert to 32-byte big-endian
        data = value.to_bytes(32, byteorder="big")
        return cls(data)

    @classmethod
    def from_bytes(cls, data: bytes) -> Self:
        """
        Create from big-endian bytes.

        Args:
            data: Up to 32 bytes (left-padded if shorter).

        Returns:
            Uint256 instance.

        Raises:
            InvalidLengthError: Exceeds 32 bytes.
        """
        if len(data) > 32:
            raise InvalidLengthError(f"Expected at most 32 bytes, got {len(data)}")

        # Left-pad with zeros if needed
        if len(data) < 32:
            data = b'\x00' * (32 - len(data)) + data

        return cls(data)

    @classmethod
    def zero(cls) -> Self:
        """Create zero value."""
        return cls(b'\x00' * 32)

    def to_hex(self) -> str:
        """
        Return hex string with 0x prefix, zero-padded to 64 characters.

        Returns:
            Hex string (0x + 64 hex chars).
        """
        lib = get_lib()
        # Buffer: 0x + 64 hex chars + null terminator = 67 bytes
        buf = ctypes.create_string_buffer(67)
        c_struct = PrimitivesU256()
        c_struct.bytes[:] = self._data

        code = lib.primitives_u256_to_hex(ctypes.byref(c_struct), buf, 67)
        check_error(code, "Uint256.to_hex")

        return buf.value.decode("ascii")

    def to_int(self) -> int:
        """
        Return Python integer.

        Returns:
            Integer value.
        """
        return int.from_bytes(self._data, byteorder="big")

    def to_bytes(self) -> bytes:
        """
        Return 32-byte big-endian representation.

        Returns:
            32 bytes.
        """
        return self._data

    def __int__(self) -> int:
        """Convert to Python int."""
        return self.to_int()

    def __eq__(self, other: object) -> bool:
        """Check equality."""
        if not isinstance(other, Uint256):
            return NotImplemented
        return self._data == other._data

    def __lt__(self, other: Uint256) -> bool:
        """Less than comparison."""
        if not isinstance(other, Uint256):
            return NotImplemented
        return self.to_int() < other.to_int()

    def __le__(self, other: Uint256) -> bool:
        """Less than or equal comparison."""
        if not isinstance(other, Uint256):
            return NotImplemented
        return self.to_int() <= other.to_int()

    def __gt__(self, other: Uint256) -> bool:
        """Greater than comparison."""
        if not isinstance(other, Uint256):
            return NotImplemented
        return self.to_int() > other.to_int()

    def __ge__(self, other: Uint256) -> bool:
        """Greater than or equal comparison."""
        if not isinstance(other, Uint256):
            return NotImplemented
        return self.to_int() >= other.to_int()

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash(self._data)

    def __repr__(self) -> str:
        """Debug representation."""
        hex_str = self.to_hex()
        # Truncate middle for readability
        if len(hex_str) > 20:
            return f"Uint256({hex_str[:10]}...{hex_str[-6:]})"
        return f"Uint256({hex_str})"

    def __str__(self) -> str:
        """String representation."""
        return self.to_hex()
