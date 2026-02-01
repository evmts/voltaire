"""
Bytecode - EVM bytecode analysis and validation utilities.
"""

import ctypes
from ctypes import c_uint32, c_uint8

from voltaire._ffi import c_uint8_p, get_lib
from voltaire.errors import InvalidHexError, check_error


class Bytecode:
    """
    EVM bytecode analysis utilities.

    Provides tools for analyzing EVM bytecode including:
    - JUMPDEST location analysis
    - Instruction boundary detection
    - Bytecode validation
    - Program counter navigation

    Example:
        >>> bytecode = Bytecode.from_hex("0x60005b00")  # PUSH1 0x00, JUMPDEST, STOP
        >>> bytecode.is_valid_jumpdest(2)
        True
    """

    __slots__ = ("_code", "_jumpdest_bitmap")

    def __init__(self, code: bytes) -> None:
        """
        Create bytecode analyzer from raw bytecode.

        Args:
            code: Raw bytecode bytes
        """
        self._code = code
        self._jumpdest_bitmap: bytes | None = None

    @classmethod
    def from_hex(cls, hex_str: str) -> "Bytecode":
        """
        Create from hex string.

        Args:
            hex_str: Hex string with or without 0x prefix

        Returns:
            Bytecode instance

        Raises:
            InvalidHexError: Invalid hex string
        """
        # Strip 0x prefix if present
        if hex_str.startswith(("0x", "0X")):
            hex_str = hex_str[2:]

        # Handle empty hex
        if not hex_str:
            return cls(b"")

        # Validate hex characters and length
        if len(hex_str) % 2 != 0:
            raise InvalidHexError("Bytecode.from_hex: odd-length hex string")

        try:
            code = bytes.fromhex(hex_str)
        except ValueError as e:
            raise InvalidHexError(f"Bytecode.from_hex: invalid hex characters") from e

        return cls(code)

    def analyze_jumpdests(self) -> bytes:
        """
        Analyze and return JUMPDEST positions (cached).

        Returns a bytes object containing JUMPDEST positions as 4-byte
        little-endian integers.

        Returns:
            Bytes containing JUMPDEST positions
        """
        if self._jumpdest_bitmap is not None:
            return self._jumpdest_bitmap

        if not self._code:
            self._jumpdest_bitmap = b""
            return self._jumpdest_bitmap

        lib = get_lib()

        # Allocate output buffer for JUMPDEST positions
        # Maximum possible JUMPDESTs is len(code)
        max_jumpdests = len(self._code)
        out_jumpdests = (c_uint32 * max_jumpdests)()

        # Create pointer to code
        code_array = (c_uint8 * len(self._code))(*self._code)
        code_ptr = ctypes.cast(code_array, c_uint8_p)

        count = lib.primitives_bytecode_analyze_jumpdests(
            code_ptr,
            len(self._code),
            out_jumpdests,
            max_jumpdests,
        )

        # Convert positions to bytes (4-byte little-endian each)
        result = b""
        for i in range(count):
            result += out_jumpdests[i].to_bytes(4, "little")

        self._jumpdest_bitmap = result
        return self._jumpdest_bitmap

    def is_boundary(self, position: int) -> bool:
        """
        Check if position is an instruction boundary.

        Returns True if the position is at an opcode, False if it's
        inside PUSH immediate data.

        Args:
            position: Byte position to check

        Returns:
            True if position is at an instruction boundary
        """
        if not self._code:
            return False

        if position < 0 or position >= len(self._code):
            return False

        lib = get_lib()

        code_array = (c_uint8 * len(self._code))(*self._code)
        code_ptr = ctypes.cast(code_array, c_uint8_p)

        return lib.primitives_bytecode_is_boundary(
            code_ptr,
            len(self._code),
            position,
        )

    def is_valid_jumpdest(self, position: int) -> bool:
        """
        Check if position is a valid JUMPDEST.

        A valid JUMPDEST must be at an instruction boundary and
        contain the JUMPDEST opcode (0x5b).

        Args:
            position: Byte position to check

        Returns:
            True if position is a valid JUMPDEST
        """
        if not self._code:
            return False

        if position < 0 or position >= len(self._code):
            return False

        lib = get_lib()

        code_array = (c_uint8 * len(self._code))(*self._code)
        code_ptr = ctypes.cast(code_array, c_uint8_p)

        return lib.primitives_bytecode_is_valid_jumpdest(
            code_ptr,
            len(self._code),
            position,
        )

    def validate(self) -> bool:
        """
        Validate bytecode structure.

        Checks that all PUSH instructions have complete immediate data.

        Returns:
            True if bytecode is structurally valid
        """
        if not self._code:
            return True  # Empty bytecode is valid

        lib = get_lib()

        code_array = (c_uint8 * len(self._code))(*self._code)
        code_ptr = ctypes.cast(code_array, c_uint8_p)

        result = lib.primitives_bytecode_validate(
            code_ptr,
            len(self._code),
        )

        # 0 = success (valid), negative = error (invalid)
        return result == 0

    def get_next_pc(self, current_pc: int) -> int:
        """
        Get next program counter position.

        For PUSH instructions, this skips over the immediate data bytes.

        Args:
            current_pc: Current program counter position

        Returns:
            Next PC position, or -1 if at end/invalid
        """
        if not self._code:
            return -1

        if current_pc < 0:
            return -1

        lib = get_lib()

        code_array = (c_uint8 * len(self._code))(*self._code)
        code_ptr = ctypes.cast(code_array, c_uint8_p)

        result = lib.primitives_bytecode_get_next_pc(
            code_ptr,
            len(self._code),
            current_pc,
        )

        return result

    def to_bytes(self) -> bytes:
        """
        Return raw bytecode bytes.

        Returns:
            Raw bytecode
        """
        return self._code

    def __len__(self) -> int:
        """Return bytecode length."""
        return len(self._code)

    def __bytes__(self) -> bytes:
        """Support bytes(bytecode) conversion."""
        return self._code

    def __repr__(self) -> str:
        """Return debug representation."""
        return f"Bytecode({len(self._code)} bytes)"

    def __str__(self) -> str:
        """Return hex string representation."""
        return "0x" + self._code.hex()
