"""
Voltaire error types.

Maps C API error codes to Python exceptions.
"""

from typing import NoReturn


class VoltaireError(Exception):
    """Base exception for all Voltaire errors."""

    pass


class InvalidHexError(VoltaireError):
    """Invalid hexadecimal string."""

    pass


class InvalidLengthError(VoltaireError):
    """Invalid data length."""

    pass


class InvalidChecksumError(VoltaireError):
    """Invalid EIP-55 checksum."""

    pass


class OutOfMemoryError(VoltaireError):
    """Memory allocation failed."""

    pass


class InvalidInputError(VoltaireError):
    """Invalid input data."""

    pass


class InvalidSignatureError(VoltaireError):
    """Invalid cryptographic signature."""

    pass


class InvalidSelectorError(VoltaireError):
    """Invalid function selector."""

    pass


class UnsupportedTypeError(VoltaireError):
    """Unsupported ABI type."""

    pass


class MaxLengthExceededError(VoltaireError):
    """Maximum length exceeded."""

    pass


class InvalidAccessListError(VoltaireError):
    """Invalid access list."""

    pass


class InvalidAuthorizationError(VoltaireError):
    """Invalid EIP-7702 authorization."""

    pass


class InvalidValueError(VoltaireError):
    """Invalid value (e.g., negative nonce)."""

    pass


# Error code to exception mapping
_ERROR_MAP: dict[int, type[VoltaireError]] = {
    -1: InvalidHexError,
    -2: InvalidLengthError,
    -3: InvalidChecksumError,
    -4: OutOfMemoryError,
    -5: InvalidInputError,
    -6: InvalidSignatureError,
    -7: InvalidSelectorError,
    -8: UnsupportedTypeError,
    -9: MaxLengthExceededError,
    -10: InvalidAccessListError,
    -11: InvalidAuthorizationError,
}


def check_error(code: int, context: str = "") -> None:
    """
    Check C API return code and raise appropriate exception.

    Args:
        code: Return code from C API (0 = success, negative = error)
        context: Optional context string for error message

    Raises:
        VoltaireError: If code indicates an error
    """
    if code >= 0:
        return

    exc_class = _ERROR_MAP.get(code, VoltaireError)
    msg = f"Error code {code}"
    if context:
        msg = f"{context}: {msg}"
    raise exc_class(msg)


def raise_error(code: int, context: str = "") -> NoReturn:
    """
    Raise exception for error code (unconditionally).

    Args:
        code: Error code from C API
        context: Optional context string

    Raises:
        VoltaireError: Always
    """
    exc_class = _ERROR_MAP.get(code, VoltaireError)
    msg = f"Error code {code}"
    if context:
        msg = f"{context}: {msg}"
    raise exc_class(msg)
