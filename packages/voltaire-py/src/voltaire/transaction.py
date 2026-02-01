"""
Transaction - type detection and address calculation utilities.
"""

from __future__ import annotations

import ctypes
from ctypes import POINTER, c_size_t, c_uint8
from enum import IntEnum
from typing import TYPE_CHECKING

from voltaire._ffi import PrimitivesAddress, get_lib
from voltaire.errors import InvalidInputError, InvalidLengthError, check_error

if TYPE_CHECKING:
    from voltaire.address import Address


class TransactionType(IntEnum):
    """
    Ethereum transaction types.

    Each type corresponds to an EIP that introduced new transaction formats.
    """

    LEGACY = 0    # Pre-EIP-2718 legacy transaction
    EIP2930 = 1   # Access list transaction (EIP-2930)
    EIP1559 = 2   # Fee market transaction (EIP-1559)
    EIP4844 = 3   # Blob transaction (EIP-4844)
    EIP7702 = 4   # Set code transaction (EIP-7702)


class Transaction:
    """
    Transaction utilities for type detection and address calculation.

    This class provides static methods only - it is not meant to be instantiated.
    """

    @staticmethod
    def detect_type(data: bytes) -> TransactionType:
        """
        Detect transaction type from serialized data.

        Transaction type is determined from the first byte:
        - 0x01: EIP-2930 (Access List)
        - 0x02: EIP-1559 (Fee Market)
        - 0x03: EIP-4844 (Blob)
        - 0x04: EIP-7702 (Set Code)
        - >= 0xc0: Legacy (RLP list prefix)

        Args:
            data: Serialized transaction bytes

        Returns:
            TransactionType enum value

        Raises:
            InvalidInputError: If data is empty
        """
        if not data:
            raise InvalidInputError("Transaction.detect_type: data cannot be empty")

        lib = get_lib()

        # Convert bytes to ctypes array
        data_array = (c_uint8 * len(data)).from_buffer_copy(data)
        data_ptr = ctypes.cast(data_array, POINTER(c_uint8))

        result = lib.primitives_tx_detect_type(data_ptr, c_size_t(len(data)))

        # Result is type value (0-4) or negative error
        if result < 0:
            check_error(result, "Transaction.detect_type")

        return TransactionType(result)

    @staticmethod
    def calculate_create_address(sender: "Address", nonce: int) -> "Address":
        """
        Calculate the contract address from CREATE opcode.

        Formula: keccak256(RLP([sender, nonce]))[12:]

        Args:
            sender: The address deploying the contract
            nonce: The deployer's transaction nonce

        Returns:
            The address where the contract will be deployed
        """
        # Import here to avoid circular import
        from voltaire.address import Address as AddressClass

        lib = get_lib()
        out_address = PrimitivesAddress()

        result = lib.primitives_calculate_create_address(
            ctypes.byref(sender._data),
            nonce,
            ctypes.byref(out_address),
        )
        check_error(result, "Transaction.calculate_create_address")

        return AddressClass(out_address)

    @staticmethod
    def calculate_create2_address(
        sender: "Address",
        salt: bytes,
        init_code: bytes,
    ) -> "Address":
        """
        Calculate the deterministic contract address from CREATE2.

        Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]

        Args:
            sender: The factory contract address
            salt: 32-byte salt value
            init_code: Contract initialization bytecode

        Returns:
            The deterministic address where the contract will be deployed

        Raises:
            InvalidLengthError: If salt is not exactly 32 bytes
        """
        # Import here to avoid circular import
        from voltaire.address import Address as AddressClass

        if len(salt) != 32:
            raise InvalidLengthError(
                f"Transaction.calculate_create2_address: salt must be 32 bytes, got {len(salt)}"
            )

        lib = get_lib()
        out_address = PrimitivesAddress()

        # Convert salt to ctypes array
        salt_array = (c_uint8 * 32).from_buffer_copy(salt)

        # Convert init_code to ctypes
        if init_code:
            init_code_array = (c_uint8 * len(init_code)).from_buffer_copy(init_code)
            init_code_ptr = ctypes.cast(init_code_array, POINTER(c_uint8))
            init_code_len = len(init_code)
        else:
            # Empty init_code
            init_code_ptr = ctypes.cast(None, POINTER(c_uint8))
            init_code_len = 0

        result = lib.primitives_calculate_create2_address(
            ctypes.byref(sender._data),
            ctypes.byref(salt_array),
            init_code_ptr,
            c_size_t(init_code_len),
            ctypes.byref(out_address),
        )
        check_error(result, "Transaction.calculate_create2_address")

        return AddressClass(out_address)
