"""
Hash module - 32-byte cryptographic hash type.

Provides Keccak-256, SHA-256, and EIP-191 message hashing.
"""

from __future__ import annotations

import ctypes
from ctypes import POINTER, c_uint8

from voltaire._ffi import PrimitivesHash, get_lib
from voltaire.errors import InvalidHexError, InvalidLengthError, check_error


class Hash:
    """
    32-byte cryptographic hash value.

    Immutable, bytes-backed storage with constant-time equality comparison.
    """

    __slots__ = ("_data",)

    def __init__(self, data: bytes) -> None:
        """
        Initialize Hash from raw bytes.

        Use from_hex() or from_bytes() instead for validation.
        """
        self._data = data

    @classmethod
    def from_hex(cls, hex_str: str) -> Hash:
        """
        Create Hash from hex string.

        Args:
            hex_str: 64-character hex string, with or without 0x prefix.

        Returns:
            Hash instance.

        Raises:
            InvalidHexError: If hex string is invalid.
        """
        lib = get_lib()
        out_hash = PrimitivesHash()

        # Encode to bytes for C API
        hex_bytes = hex_str.encode("ascii")

        code = lib.primitives_hash_from_hex(hex_bytes, ctypes.byref(out_hash))
        if code < 0:
            raise InvalidHexError(f"Invalid hex string: {hex_str}")

        return cls(bytes(out_hash.bytes))

    @classmethod
    def from_bytes(cls, data: bytes) -> Hash:
        """
        Create Hash from raw bytes.

        Args:
            data: Exactly 32 bytes.

        Returns:
            Hash instance.

        Raises:
            InvalidLengthError: If data is not 32 bytes.
        """
        if len(data) != 32:
            raise InvalidLengthError(f"Hash must be 32 bytes, got {len(data)}")
        return cls(bytes(data))

    def to_hex(self) -> str:
        """
        Convert to lowercase hex string with 0x prefix.

        Returns:
            66-character hex string (0x + 64 hex chars).
        """
        lib = get_lib()

        # Create C struct from our bytes
        c_hash = PrimitivesHash()
        for i, b in enumerate(self._data):
            c_hash.bytes[i] = b

        # Buffer for hex output (66 bytes: 0x + 64 chars + null)
        buf = ctypes.create_string_buffer(67)

        code = lib.primitives_hash_to_hex(ctypes.byref(c_hash), buf)
        check_error(code, "hash_to_hex")

        return buf.value[:66].decode("ascii")

    def to_bytes(self) -> bytes:
        """
        Get raw bytes.

        Returns:
            32-byte bytes object.
        """
        return self._data

    def __eq__(self, other: object) -> bool:
        """
        Constant-time equality comparison.

        Returns False for non-Hash objects.
        """
        if not isinstance(other, Hash):
            return False

        lib = get_lib()

        # Create C structs
        a = PrimitivesHash()
        b = PrimitivesHash()
        for i in range(32):
            a.bytes[i] = self._data[i]
            b.bytes[i] = other._data[i]

        return lib.primitives_hash_equals(ctypes.byref(a), ctypes.byref(b))

    def __hash__(self) -> int:
        """Hash for use in sets and dicts."""
        return hash(self._data)

    def __repr__(self) -> str:
        """String representation."""
        hex_str = self.to_hex()
        return f"Hash({hex_str})"


def keccak256(data: bytes | str) -> Hash:
    """
    Compute Keccak-256 hash.

    This is Ethereum's keccak256, NOT SHA3-256.

    Args:
        data: Input bytes or string (UTF-8 encoded).

    Returns:
        32-byte Hash.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")

    lib = get_lib()
    out_hash = PrimitivesHash()

    # Convert bytes to ctypes array
    data_len = len(data)
    if data_len > 0:
        data_array = (c_uint8 * data_len).from_buffer_copy(data)
        data_ptr = ctypes.cast(data_array, POINTER(c_uint8))
    else:
        data_ptr = ctypes.cast(ctypes.c_char_p(b""), POINTER(c_uint8))

    code = lib.primitives_keccak256(data_ptr, data_len, ctypes.byref(out_hash))
    check_error(code, "keccak256")

    return Hash(bytes(out_hash.bytes))


def sha256(data: bytes | str) -> Hash:
    """
    Compute SHA-256 hash.

    Args:
        data: Input bytes or string (UTF-8 encoded).

    Returns:
        32-byte Hash.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")

    lib = get_lib()
    out_hash = (c_uint8 * 32)()

    # Convert bytes to ctypes array
    data_len = len(data)
    if data_len > 0:
        data_array = (c_uint8 * data_len).from_buffer_copy(data)
        data_ptr = ctypes.cast(data_array, POINTER(c_uint8))
    else:
        data_ptr = ctypes.cast(ctypes.c_char_p(b""), POINTER(c_uint8))

    code = lib.primitives_sha256(data_ptr, data_len, ctypes.byref(out_hash))
    check_error(code, "sha256")

    return Hash(bytes(out_hash))


def eip191_hash_message(message: bytes | str) -> Hash:
    """
    Hash a message using EIP-191 personal message format.

    Prepends the standard Ethereum prefix:
    "\\x19Ethereum Signed Message:\\n" + len(message) + message

    Args:
        message: Message bytes or string (UTF-8 encoded).

    Returns:
        32-byte Hash suitable for signing.
    """
    if isinstance(message, str):
        message = message.encode("utf-8")

    lib = get_lib()
    out_hash = PrimitivesHash()

    # Convert bytes to ctypes array
    msg_len = len(message)
    if msg_len > 0:
        msg_array = (c_uint8 * msg_len).from_buffer_copy(message)
        msg_ptr = ctypes.cast(msg_array, POINTER(c_uint8))
    else:
        msg_ptr = ctypes.cast(ctypes.c_char_p(b""), POINTER(c_uint8))

    code = lib.primitives_eip191_hash_message(msg_ptr, msg_len, ctypes.byref(out_hash))
    check_error(code, "eip191_hash_message")

    return Hash(bytes(out_hash.bytes))


def blake2b(data: bytes | str) -> bytes:
    """
    Compute BLAKE2b hash of data.

    BLAKE2b is a cryptographic hash function optimized for 64-bit platforms.
    Used in EIP-152 precompile.

    Note: This implementation always produces 64-byte output. For variable-length
    BLAKE2b, use the Python hashlib module.

    Args:
        data: Input bytes or string (UTF-8 encoded).

    Returns:
        64-byte hash.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")

    lib = get_lib()
    out_hash = (c_uint8 * 64)()

    # Convert bytes to ctypes array
    data_len = len(data)
    if data_len > 0:
        data_array = (c_uint8 * data_len).from_buffer_copy(data)
        data_ptr = ctypes.cast(data_array, POINTER(c_uint8))
    else:
        data_ptr = ctypes.cast(ctypes.c_char_p(b""), POINTER(c_uint8))

    code = lib.primitives_blake2b(data_ptr, data_len, ctypes.byref(out_hash))
    check_error(code, "blake2b")

    return bytes(out_hash)


def ripemd160(data: bytes | str) -> bytes:
    """
    Compute RIPEMD-160 hash of data.

    RIPEMD-160 produces a 20-byte hash. Used in Bitcoin address derivation
    where hash160 = RIPEMD160(SHA256(data)).

    Args:
        data: Input bytes or string (UTF-8 encoded).

    Returns:
        20-byte hash.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")

    lib = get_lib()
    out_hash = (c_uint8 * 20)()

    # Convert bytes to ctypes array
    data_len = len(data)
    if data_len > 0:
        data_array = (c_uint8 * data_len).from_buffer_copy(data)
        data_ptr = ctypes.cast(data_array, POINTER(c_uint8))
    else:
        data_ptr = ctypes.cast(ctypes.c_char_p(b""), POINTER(c_uint8))

    code = lib.primitives_ripemd160(data_ptr, data_len, ctypes.byref(out_hash))
    check_error(code, "ripemd160")

    return bytes(out_hash)
