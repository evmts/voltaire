"""
Address - 20-byte Ethereum address with EIP-55 checksum support.
"""

import ctypes
from ctypes import POINTER, c_uint8, c_uint64
from typing import ClassVar

from voltaire._ffi import PrimitivesAddress, get_lib
from voltaire.errors import check_error, InvalidLengthError, InvalidValueError


class Address:
    """
    20-byte Ethereum address with EIP-55 checksum support.

    Addresses are immutable, hashable, and comparable. They can be created from
    hex strings or raw bytes, and converted to various formats.

    Example:
        >>> addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
        >>> print(addr.to_checksum())
        0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20
    """

    __slots__ = ("_data",)

    _ZERO: ClassVar["Address | None"] = None

    def __init__(self, data: PrimitivesAddress) -> None:
        """Internal constructor. Use from_hex, from_bytes, or zero() instead."""
        self._data = data

    @classmethod
    def from_hex(cls, hex_str: str) -> "Address":
        """
        Create an address from a hex string.

        Args:
            hex_str: Hex string with or without 0x prefix (40 or 42 chars)

        Returns:
            Address instance

        Raises:
            InvalidHexError: Invalid hex characters
            InvalidLengthError: Not exactly 20 bytes
        """
        lib = get_lib()
        addr = PrimitivesAddress()

        # Ensure 0x prefix for C API
        if not hex_str.startswith(("0x", "0X")):
            hex_str = "0x" + hex_str

        result = lib.primitives_address_from_hex(
            hex_str.encode("ascii"), ctypes.byref(addr)
        )
        check_error(result, "Address.from_hex")

        return cls(addr)

    @classmethod
    def from_bytes(cls, data: bytes) -> "Address":
        """
        Create an address from raw bytes.

        Args:
            data: Exactly 20 bytes

        Returns:
            Address instance

        Raises:
            InvalidLengthError: Not exactly 20 bytes
        """
        if len(data) != 20:
            raise InvalidLengthError(
                f"Address.from_bytes: expected 20 bytes, got {len(data)}"
            )

        addr = PrimitivesAddress()
        ctypes.memmove(addr.bytes, data, 20)
        return cls(addr)

    @classmethod
    def zero(cls) -> "Address":
        """
        Create the zero address (20 null bytes).

        Returns:
            Zero address instance (cached)
        """
        if cls._ZERO is None:
            addr = PrimitivesAddress()
            ctypes.memset(addr.bytes, 0, 20)
            cls._ZERO = cls(addr)
        return cls._ZERO

    @classmethod
    def calculate_create_address(cls, sender: "Address", nonce: int) -> "Address":
        """
        Calculate contract address for CREATE opcode.

        address = keccak256(rlp([sender, nonce]))[12:]

        Args:
            sender: Deployer address
            nonce: Transaction nonce (must be non-negative)

        Returns:
            Contract address that will be created

        Raises:
            InvalidValueError: If nonce is negative
        """
        if nonce < 0:
            raise InvalidValueError(
                f"Address.calculate_create_address: nonce must be non-negative, got {nonce}"
            )

        lib = get_lib()
        out_addr = PrimitivesAddress()

        result = lib.primitives_calculate_create_address(
            ctypes.byref(sender._data),
            c_uint64(nonce),
            ctypes.byref(out_addr),
        )
        check_error(result, "Address.calculate_create_address")

        return cls(out_addr)

    @classmethod
    def calculate_create2_address(
        cls, sender: "Address", salt: bytes, init_code: bytes
    ) -> "Address":
        """
        Calculate contract address for CREATE2 opcode.

        address = keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]

        Args:
            sender: Factory contract address
            salt: 32-byte salt value
            init_code: Contract initialization code

        Returns:
            Deterministic contract address

        Raises:
            InvalidLengthError: If salt is not exactly 32 bytes
        """
        if len(salt) != 32:
            raise InvalidLengthError(
                f"Address.calculate_create2_address: salt must be 32 bytes, got {len(salt)}"
            )

        lib = get_lib()
        out_addr = PrimitivesAddress()

        # Convert salt to ctypes array
        salt_array = (c_uint8 * 32)(*salt)

        # Convert init_code to ctypes pointer
        if len(init_code) > 0:
            init_code_ptr = (c_uint8 * len(init_code))(*init_code)
        else:
            init_code_ptr = None

        result = lib.primitives_calculate_create2_address(
            ctypes.byref(sender._data),
            ctypes.byref(salt_array),
            ctypes.cast(init_code_ptr, POINTER(c_uint8)) if init_code_ptr else None,
            len(init_code),
            ctypes.byref(out_addr),
        )
        check_error(result, "Address.calculate_create2_address")

        return cls(out_addr)

    def to_hex(self) -> str:
        """
        Return lowercase hex string with 0x prefix.

        Returns:
            42-character hex string (e.g., "0x1234...abcd")
        """
        lib = get_lib()
        buf = ctypes.create_string_buffer(43)  # 42 chars + null terminator
        result = lib.primitives_address_to_hex(ctypes.byref(self._data), buf)
        check_error(result, "Address.to_hex")
        return buf.value.decode("ascii")

    def to_checksum(self) -> str:
        """
        Return EIP-55 checksummed hex string.

        Returns:
            42-character mixed-case hex string
        """
        lib = get_lib()
        buf = ctypes.create_string_buffer(43)  # 42 chars + null terminator
        result = lib.primitives_address_to_checksum_hex(ctypes.byref(self._data), buf)
        check_error(result, "Address.to_checksum")
        return buf.value.decode("ascii")

    def to_bytes(self) -> bytes:
        """
        Return raw 20-byte representation.

        Returns:
            20 bytes
        """
        return bytes(self._data.bytes)

    def is_zero(self) -> bool:
        """
        Check if this is the zero address.

        Returns:
            True if all bytes are zero
        """
        lib = get_lib()
        return lib.primitives_address_is_zero(ctypes.byref(self._data))

    @staticmethod
    def validate_checksum(hex_str: str) -> bool:
        """
        Validate that a hex string has correct EIP-55 checksum.

        Args:
            hex_str: Hex string to validate (must have 0x prefix)

        Returns:
            True if checksum is valid, False otherwise
        """
        lib = get_lib()

        # Ensure 0x prefix
        if not hex_str.startswith(("0x", "0X")):
            hex_str = "0x" + hex_str

        return lib.primitives_address_validate_checksum(hex_str.encode("ascii"))

    def __eq__(self, other: object) -> bool:
        """Check equality with another Address."""
        if not isinstance(other, Address):
            return NotImplemented
        lib = get_lib()
        return lib.primitives_address_equals(
            ctypes.byref(self._data), ctypes.byref(other._data)
        )

    def __hash__(self) -> int:
        """Return hash of address bytes."""
        return hash(bytes(self._data.bytes))

    def __bytes__(self) -> bytes:
        """Support bytes(addr) conversion."""
        return self.to_bytes()

    def __repr__(self) -> str:
        """Return debug representation."""
        return f"Address('{self.to_checksum()}')"

    def __str__(self) -> str:
        """Return checksummed address string."""
        return self.to_checksum()
