"""
Secp256k1 - secp256k1 elliptic curve operations for Ethereum.

Provides public key recovery, address derivation, and signature validation.
"""

import ctypes
from ctypes import POINTER, c_bool, c_uint8
from dataclasses import dataclass
from typing import TYPE_CHECKING

from voltaire._ffi import PrimitivesAddress, get_lib
from voltaire.errors import (
    InvalidInputError,
    InvalidLengthError,
    InvalidSignatureError,
    check_error,
)

if TYPE_CHECKING:
    from voltaire.address import Address


@dataclass(frozen=True)
class Signature:
    """
    ECDSA signature with recovery id.

    Attributes:
        r: 32-byte r component (big-endian)
        s: 32-byte s component (big-endian)
        v: Recovery id (0, 1, 27, or 28)
    """

    r: bytes
    s: bytes
    v: int


# Track if FFI functions are set up
_functions_setup = False


def _setup_secp256k1_functions(lib) -> None:
    """Define C function signatures for secp256k1 operations."""
    c_uint8_array_32 = c_uint8 * 32
    c_uint8_array_64 = c_uint8 * 64

    # validate_signature is already set up in _ffi.py, but we need it here too
    # Check if it exists, if not set it up
    if not hasattr(lib, "_secp256k1_validate_setup"):
        lib.primitives_secp256k1_validate_signature.argtypes = [
            POINTER(c_uint8_array_32),
            POINTER(c_uint8_array_32),
        ]
        lib.primitives_secp256k1_validate_signature.restype = c_bool
        lib._secp256k1_validate_setup = True


def _ensure_functions_setup():
    """Ensure FFI function signatures are defined."""
    global _functions_setup
    if not _functions_setup:
        lib = get_lib()
        _setup_secp256k1_functions(lib)
        _functions_setup = True


class Secp256k1:
    """
    secp256k1 elliptic curve operations.

    Provides methods for public key recovery, address derivation,
    and signature validation used in Ethereum.
    """

    @staticmethod
    def recover_public_key(message_hash: bytes, signature: Signature) -> bytes:
        """
        Recover uncompressed public key from ECDSA signature.

        Args:
            message_hash: 32-byte message hash that was signed
            signature: Signature with r, s, v components

        Returns:
            64-byte uncompressed public key (x || y)

        Raises:
            InvalidLengthError: If message_hash, r, or s is not 32 bytes
            InvalidSignatureError: If signature is invalid or recovery fails
        """
        if len(message_hash) != 32:
            raise InvalidLengthError(
                f"message_hash must be 32 bytes, got {len(message_hash)}"
            )
        if len(signature.r) != 32:
            raise InvalidLengthError(
                f"signature.r must be 32 bytes, got {len(signature.r)}"
            )
        if len(signature.s) != 32:
            raise InvalidLengthError(
                f"signature.s must be 32 bytes, got {len(signature.s)}"
            )

        # Validate v value
        v = signature.v
        if v not in (0, 1, 27, 28):
            raise InvalidSignatureError(
                f"signature.v must be 0, 1, 27, or 28, got {v}"
            )

        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32
        c_uint8_array_64 = c_uint8 * 64

        msg_hash_arr = c_uint8_array_32(*message_hash)
        r_arr = c_uint8_array_32(*signature.r)
        s_arr = c_uint8_array_32(*signature.s)
        out_pubkey = c_uint8_array_64()

        result = lib.primitives_secp256k1_recover_pubkey(
            ctypes.byref(msg_hash_arr),
            ctypes.byref(r_arr),
            ctypes.byref(s_arr),
            c_uint8(v),
            ctypes.byref(out_pubkey),
        )

        if result != 0:
            raise InvalidSignatureError(
                f"Failed to recover public key (error code: {result})"
            )

        return bytes(out_pubkey)

    @staticmethod
    def recover_address(message_hash: bytes, signature: Signature) -> "Address":
        """
        Recover Ethereum address from ECDSA signature.

        Args:
            message_hash: 32-byte message hash that was signed
            signature: Signature with r, s, v components

        Returns:
            Address of the signer

        Raises:
            InvalidLengthError: If message_hash, r, or s is not 32 bytes
            InvalidSignatureError: If signature is invalid or recovery fails
        """
        # Import here to avoid circular imports
        from voltaire.address import Address

        if len(message_hash) != 32:
            raise InvalidLengthError(
                f"message_hash must be 32 bytes, got {len(message_hash)}"
            )
        if len(signature.r) != 32:
            raise InvalidLengthError(
                f"signature.r must be 32 bytes, got {len(signature.r)}"
            )
        if len(signature.s) != 32:
            raise InvalidLengthError(
                f"signature.s must be 32 bytes, got {len(signature.s)}"
            )

        # Validate v value
        v = signature.v
        if v not in (0, 1, 27, 28):
            raise InvalidSignatureError(
                f"signature.v must be 0, 1, 27, or 28, got {v}"
            )

        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32

        msg_hash_arr = c_uint8_array_32(*message_hash)
        r_arr = c_uint8_array_32(*signature.r)
        s_arr = c_uint8_array_32(*signature.s)
        out_address = PrimitivesAddress()

        result = lib.primitives_secp256k1_recover_address(
            ctypes.byref(msg_hash_arr),
            ctypes.byref(r_arr),
            ctypes.byref(s_arr),
            c_uint8(v),
            ctypes.byref(out_address),
        )

        if result != 0:
            raise InvalidSignatureError(
                f"Failed to recover address (error code: {result})"
            )

        return Address(out_address)

    @staticmethod
    def public_key_from_private(private_key: bytes) -> bytes:
        """
        Derive public key from private key.

        Args:
            private_key: 32-byte private key

        Returns:
            64-byte uncompressed public key (x || y)

        Raises:
            InvalidLengthError: If private_key is not 32 bytes
            InvalidInputError: If private key is invalid (zero or >= curve order)
        """
        if len(private_key) != 32:
            raise InvalidLengthError(
                f"private_key must be 32 bytes, got {len(private_key)}"
            )

        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32
        c_uint8_array_64 = c_uint8 * 64

        privkey_arr = c_uint8_array_32(*private_key)
        out_pubkey = c_uint8_array_64()

        result = lib.primitives_secp256k1_pubkey_from_private(
            ctypes.byref(privkey_arr),
            ctypes.byref(out_pubkey),
        )

        if result != 0:
            raise InvalidInputError(
                f"Invalid private key (error code: {result})"
            )

        return bytes(out_pubkey)

    @staticmethod
    def validate_signature(r: bytes, s: bytes) -> bool:
        """
        Validate signature components are within valid range.

        Checks that both r and s are non-zero and less than the curve order N.

        Args:
            r: 32-byte r component
            s: 32-byte s component

        Returns:
            True if both r and s are valid

        Raises:
            InvalidLengthError: If r or s is not 32 bytes
        """
        if len(r) != 32:
            raise InvalidLengthError(f"r must be 32 bytes, got {len(r)}")
        if len(s) != 32:
            raise InvalidLengthError(f"s must be 32 bytes, got {len(s)}")

        _ensure_functions_setup()
        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32

        r_arr = c_uint8_array_32(*r)
        s_arr = c_uint8_array_32(*s)

        return bool(
            lib.primitives_secp256k1_validate_signature(
                ctypes.byref(r_arr),
                ctypes.byref(s_arr),
            )
        )

    @staticmethod
    def generate_private_key() -> bytes:
        """
        Generate a cryptographically secure random private key.

        Returns:
            32-byte private key suitable for secp256k1

        Notes:
            - Uses OS-provided CSPRNG
            - Key is guaranteed to be in valid range (1 to N-1)
            - Never returns zero or values >= curve order
        """
        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32
        out_key = c_uint8_array_32()

        result = lib.primitives_generate_private_key(ctypes.byref(out_key))

        if result != 0:
            raise InvalidInputError(
                f"Failed to generate private key (error code: {result})"
            )

        return bytes(out_key)

    @staticmethod
    def compress_public_key(uncompressed: bytes) -> bytes:
        """
        Compress a 64-byte uncompressed public key to 33 bytes.

        Args:
            uncompressed: 64-byte public key (x || y coordinates)

        Returns:
            33-byte compressed key (prefix byte + x coordinate)

        Raises:
            InvalidLengthError: If input is not 64 bytes

        Notes:
            - Prefix 0x02 if y coordinate is even
            - Prefix 0x03 if y coordinate is odd
            - x coordinate is preserved in bytes 1-33
        """
        if len(uncompressed) != 64:
            raise InvalidLengthError(
                f"uncompressed public key must be 64 bytes, got {len(uncompressed)}"
            )

        lib = get_lib()

        c_uint8_array_64 = c_uint8 * 64
        c_uint8_array_33 = c_uint8 * 33

        in_arr = c_uint8_array_64(*uncompressed)
        out_compressed = c_uint8_array_33()

        result = lib.primitives_compress_public_key(
            ctypes.byref(in_arr),
            ctypes.byref(out_compressed),
        )

        if result != 0:
            raise InvalidInputError(
                f"Failed to compress public key (error code: {result})"
            )

        return bytes(out_compressed)
