"""
Signature utilities for ECDSA secp256k1 signatures.

Provides normalization, validation, parsing, and serialization of signatures.
"""

from ctypes import POINTER, c_bool, c_int, c_size_t, c_uint8
from dataclasses import dataclass
from typing import Optional

from voltaire._ffi import get_lib
from voltaire.errors import InvalidLengthError


@dataclass
class SignatureComponents:
    """
    Parsed ECDSA signature components.

    Attributes:
        r: 32-byte r component (big-endian)
        s: 32-byte s component (big-endian)
        v: Recovery id (0, 1, 27, or 28)
    """

    r: bytes
    s: bytes
    v: int


def _setup_signature_functions(lib) -> None:
    """Define C function signatures for signature utilities."""
    c_uint8_array_32 = c_uint8 * 32
    c_uint8_p = POINTER(c_uint8)

    lib.primitives_signature_normalize.argtypes = [
        POINTER(c_uint8_array_32),  # r
        POINTER(c_uint8_array_32),  # s
    ]
    lib.primitives_signature_normalize.restype = c_bool

    lib.primitives_signature_is_canonical.argtypes = [
        POINTER(c_uint8_array_32),  # r
        POINTER(c_uint8_array_32),  # s
    ]
    lib.primitives_signature_is_canonical.restype = c_bool

    lib.primitives_signature_parse.argtypes = [
        c_uint8_p,  # sig_data
        c_size_t,  # sig_len
        POINTER(c_uint8_array_32),  # out_r
        POINTER(c_uint8_array_32),  # out_s
        POINTER(c_uint8),  # out_v
    ]
    lib.primitives_signature_parse.restype = c_int

    lib.primitives_signature_serialize.argtypes = [
        POINTER(c_uint8_array_32),  # r
        POINTER(c_uint8_array_32),  # s
        c_uint8,  # v
        c_bool,  # include_v
        c_uint8_p,  # out_buf
    ]
    lib.primitives_signature_serialize.restype = c_int


# Track if functions are set up
_functions_setup = False


def _ensure_functions_setup():
    """Ensure FFI function signatures are defined."""
    global _functions_setup
    if not _functions_setup:
        lib = get_lib()
        _setup_signature_functions(lib)
        _functions_setup = True


class SignatureUtils:
    """
    Signature manipulation utilities for ECDSA secp256k1.

    Provides methods for normalizing, validating, parsing, and serializing
    ECDSA signatures.
    """

    @staticmethod
    def normalize(r: bytes, s: bytes) -> tuple[bytes, bytes, bool]:
        """
        Normalize signature to canonical low-s form (EIP-2).

        If s is in the upper half of the curve order, it is replaced with
        N - s, where N is the secp256k1 curve order.

        Args:
            r: 32-byte r component
            s: 32-byte s component

        Returns:
            Tuple of (normalized_r, normalized_s, was_normalized).
            was_normalized is True if s was modified.

        Raises:
            InvalidLengthError: If r or s is not 32 bytes.
        """
        if len(r) != 32:
            raise InvalidLengthError(f"r must be 32 bytes, got {len(r)}")
        if len(s) != 32:
            raise InvalidLengthError(f"s must be 32 bytes, got {len(s)}")

        _ensure_functions_setup()
        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32

        # Create mutable copies
        r_arr = c_uint8_array_32(*r)
        s_arr = c_uint8_array_32(*s)

        was_normalized = lib.primitives_signature_normalize(r_arr, s_arr)

        return bytes(r_arr), bytes(s_arr), bool(was_normalized)

    @staticmethod
    def is_canonical(r: bytes, s: bytes) -> bool:
        """
        Check if signature is in canonical form per EIP-2.

        A signature is canonical if:
        - r is in range [1, N-1]
        - s is in range [1, N/2] (low-s requirement)

        Args:
            r: 32-byte r component
            s: 32-byte s component

        Returns:
            True if signature passes all validation checks.

        Raises:
            InvalidLengthError: If r or s is not 32 bytes.
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

        return bool(lib.primitives_signature_is_canonical(r_arr, s_arr))

    @staticmethod
    def parse(signature: bytes) -> SignatureComponents:
        """
        Parse signature from compact format.

        Supports two formats:
        - 64 bytes: r(32) + s(32), v defaults to 0
        - 65 bytes: r(32) + s(32) + v(1)

        Args:
            signature: 64 or 65 byte signature

        Returns:
            SignatureComponents with r, s, and v values.

        Raises:
            InvalidLengthError: If signature is not 64 or 65 bytes.
        """
        if len(signature) not in (64, 65):
            raise InvalidLengthError(
                f"Signature must be 64 or 65 bytes, got {len(signature)}"
            )

        _ensure_functions_setup()
        lib = get_lib()

        c_uint8_array_32 = c_uint8 * 32

        out_r = c_uint8_array_32()
        out_s = c_uint8_array_32()
        out_v = c_uint8()

        sig_arr = (c_uint8 * len(signature))(*signature)

        result = lib.primitives_signature_parse(
            sig_arr, len(signature), out_r, out_s, out_v
        )

        if result != 0:
            raise InvalidLengthError(
                f"Failed to parse signature (error code: {result})"
            )

        return SignatureComponents(
            r=bytes(out_r),
            s=bytes(out_s),
            v=out_v.value,
        )

    @staticmethod
    def serialize(r: bytes, s: bytes, v: Optional[int] = None) -> bytes:
        """
        Serialize signature to compact format.

        Args:
            r: 32-byte r component
            s: 32-byte s component
            v: Optional recovery id. If provided, returns 65 bytes;
               otherwise returns 64 bytes.

        Returns:
            64-byte signature if v is None, 65-byte signature if v is provided.

        Raises:
            InvalidLengthError: If r or s is not 32 bytes.
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

        include_v = v is not None
        v_byte = c_uint8(v if v is not None else 0)

        out_len = 65 if include_v else 64
        out_buf = (c_uint8 * out_len)()

        lib.primitives_signature_serialize(r_arr, s_arr, v_byte, include_v, out_buf)

        return bytes(out_buf)
