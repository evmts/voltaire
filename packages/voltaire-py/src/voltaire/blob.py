"""
Blob - EIP-4844 blob handling for data availability.

Blobs are 128KB (131072 bytes) data structures used for rollup data availability.
They use field element encoding where each 32-byte field element has byte[0] = 0x00
(BLS field constraint) and bytes 1-31 contain data.
"""

import ctypes
import struct
from typing import ClassVar

from voltaire._ffi import get_lib
from voltaire.errors import InvalidLengthError, InvalidInputError, check_error

# Constants
BLOB_SIZE = 131072  # 128KB per blob
FIELD_ELEMENTS_PER_BLOB = 4096
BYTES_PER_FIELD_ELEMENT = 32
MAX_DATA_PER_BLOB = FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4  # 126972
GAS_PER_BLOB = 131072  # 2^17
TARGET_BLOBS_PER_BLOCK = 3
TARGET_BLOB_GAS_PER_BLOCK = GAS_PER_BLOB * TARGET_BLOBS_PER_BLOCK  # 393216

# ctypes array type for blob
c_uint8_array_blob = ctypes.c_uint8 * BLOB_SIZE


class Blob:
    """
    EIP-4844 blob handling for data availability.

    Blobs are 128KB (131072 bytes) data structures used for rollup data
    availability. They encode arbitrary data using field element encoding
    with a 4-byte length prefix.

    Example:
        >>> blob = Blob.from_data(b"Hello, rollup!")
        >>> blob.to_data()
        b'Hello, rollup!'
        >>> len(blob)
        131072
    """

    __slots__ = ("_data",)

    def __init__(self, data: bytes) -> None:
        """
        Create a blob from raw 131072 bytes.

        Args:
            data: Exactly 131072 bytes of raw blob data

        Raises:
            InvalidLengthError: If data is not exactly 131072 bytes
        """
        if len(data) != BLOB_SIZE:
            raise InvalidLengthError(
                f"Blob must be exactly {BLOB_SIZE} bytes, got {len(data)}"
            )
        self._data = bytes(data)

    @classmethod
    def from_data(cls, data: bytes) -> "Blob":
        """
        Create blob from arbitrary data with length prefix encoding.

        Uses EIP-4844 field element encoding:
        - Each 32-byte field element has byte[0] = 0x00 (BLS field constraint)
        - First 4 data bytes (field 0, bytes 1-4) store big-endian length prefix
        - Data fills bytes 5-31 of field 0, then bytes 1-31 of subsequent fields

        Args:
            data: Data to encode (max 126972 bytes)

        Returns:
            Blob containing encoded data

        Raises:
            InvalidLengthError: If data exceeds maximum size
        """
        if len(data) > MAX_DATA_PER_BLOB:
            raise InvalidLengthError(
                f"Data too large: {len(data)} bytes (max {MAX_DATA_PER_BLOB})"
            )

        # Try FFI first
        lib = get_lib()
        out_blob = c_uint8_array_blob()

        # Convert data to ctypes array
        data_array = (ctypes.c_uint8 * len(data))(*data)

        result = lib.primitives_blob_from_data(
            ctypes.cast(data_array, ctypes.POINTER(ctypes.c_uint8)),
            len(data),
            ctypes.cast(out_blob, ctypes.POINTER(ctypes.c_uint8)),
        )

        if result == 0:
            return cls(bytes(out_blob))

        # Fallback to pure Python implementation
        blob_data = bytearray(BLOB_SIZE)

        # Write 4-byte big-endian length prefix at positions 1-4
        # (position 0 must be 0x00 for BLS field constraint)
        struct.pack_into(">I", blob_data, 1, len(data))

        # Copy data starting at position 5 of first field element
        data_offset = 0
        blob_offset = 5  # Start after length prefix (0 + 1-4)

        while data_offset < len(data):
            field_index = blob_offset // BYTES_PER_FIELD_ELEMENT
            field_start = field_index * BYTES_PER_FIELD_ELEMENT
            pos_in_field = blob_offset - field_start

            # Skip position 0 of each field element (must be 0x00)
            if pos_in_field == 0:
                blob_offset = field_start + 1
                continue

            blob_data[blob_offset] = data[data_offset]
            data_offset += 1
            blob_offset += 1

        return cls(bytes(blob_data))

    def to_data(self) -> bytes:
        """
        Extract original data from blob.

        Returns:
            Original data bytes

        Raises:
            InvalidInputError: If length prefix is invalid
        """
        # Try FFI first
        lib = get_lib()
        out_data = (ctypes.c_uint8 * BLOB_SIZE)()
        out_len = ctypes.c_size_t()

        blob_array = (ctypes.c_uint8 * BLOB_SIZE)(*self._data)

        result = lib.primitives_blob_to_data(
            ctypes.cast(blob_array, ctypes.POINTER(ctypes.c_uint8)),
            ctypes.cast(out_data, ctypes.POINTER(ctypes.c_uint8)),
            ctypes.byref(out_len),
        )

        if result == 0:
            return bytes(out_data[: out_len.value])

        # Fallback to pure Python implementation
        # Read 4-byte big-endian length prefix from positions 1-4
        data_length = struct.unpack_from(">I", self._data, 1)[0]

        if data_length > MAX_DATA_PER_BLOB:
            raise InvalidInputError(
                f"Invalid length prefix: {data_length} (max {MAX_DATA_PER_BLOB})"
            )

        # Extract data
        data = bytearray(data_length)
        data_offset = 0
        blob_offset = 5  # Start after length prefix (0 + 1-4)

        while data_offset < data_length:
            field_index = blob_offset // BYTES_PER_FIELD_ELEMENT
            field_start = field_index * BYTES_PER_FIELD_ELEMENT
            pos_in_field = blob_offset - field_start

            # Skip position 0 of each field element (always 0x00)
            if pos_in_field == 0:
                blob_offset = field_start + 1
                continue

            data[data_offset] = self._data[blob_offset]
            data_offset += 1
            blob_offset += 1

        return bytes(data)

    def to_bytes(self) -> bytes:
        """
        Return raw 131072-byte blob.

        Returns:
            Raw blob bytes
        """
        return self._data

    def is_valid(self) -> bool:
        """
        Check if blob has valid size.

        Returns:
            True if blob is exactly 131072 bytes
        """
        return len(self._data) == BLOB_SIZE

    @staticmethod
    def calculate_gas(blob_count: int) -> int:
        """
        Calculate total blob gas for N blobs.

        Args:
            blob_count: Number of blobs

        Returns:
            Total blob gas (blob_count * 131072)
        """
        lib = get_lib()
        return lib.primitives_blob_calculate_gas(blob_count)

    @staticmethod
    def estimate_count(data_size: int) -> int:
        """
        Estimate number of blobs needed for data size.

        Args:
            data_size: Size of data in bytes

        Returns:
            Number of blobs required
        """
        if data_size <= 0:
            return 0
        lib = get_lib()
        return lib.primitives_blob_estimate_count(data_size)

    @staticmethod
    def calculate_gas_price(excess_blob_gas: int) -> int:
        """
        Calculate blob gas price from excess blob gas.

        Uses EIP-4844 exponential formula.

        Args:
            excess_blob_gas: Current excess blob gas

        Returns:
            Blob gas price in wei
        """
        lib = get_lib()
        return lib.primitives_blob_calculate_gas_price(excess_blob_gas)

    @staticmethod
    def calculate_excess_gas(parent_excess: int, parent_used: int) -> int:
        """
        Calculate new excess blob gas for next block.

        Formula: max(0, parent_excess + parent_used - target_gas_per_block)

        Args:
            parent_excess: Parent block's excess blob gas
            parent_used: Parent block's used blob gas

        Returns:
            New excess blob gas
        """
        lib = get_lib()
        return lib.primitives_blob_calculate_excess_gas(parent_excess, parent_used)

    def __len__(self) -> int:
        """Return blob size (always 131072)."""
        return len(self._data)

    def __bytes__(self) -> bytes:
        """Support bytes(blob) conversion."""
        return self.to_bytes()

    def __repr__(self) -> str:
        """Return debug representation."""
        # Get data length from length prefix
        try:
            data_len = struct.unpack_from(">I", self._data, 1)[0]
            return f"Blob({BLOB_SIZE} bytes, data_len={data_len})"
        except Exception:
            return f"Blob({BLOB_SIZE} bytes)"

    def __eq__(self, other: object) -> bool:
        """Check equality with another Blob."""
        if not isinstance(other, Blob):
            return NotImplemented
        return self._data == other._data

    def __hash__(self) -> int:
        """Return hash of blob bytes."""
        return hash(self._data)
