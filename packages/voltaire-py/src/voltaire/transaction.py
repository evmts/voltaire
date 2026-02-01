"""
Transaction - Ethereum transaction types and utilities.

Provides:
- Transaction dataclasses for all Ethereum transaction types (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702)
- Type detection from raw bytes
- CREATE and CREATE2 address calculation
"""

from __future__ import annotations

import ctypes
from ctypes import POINTER, c_size_t, c_uint8
from dataclasses import dataclass
from enum import IntEnum
from typing import TYPE_CHECKING, Union

from voltaire._ffi import PrimitivesAddress, get_lib
from voltaire.errors import InvalidInputError, InvalidLengthError, check_error

if TYPE_CHECKING:
    from voltaire.address import Address
    from voltaire.authorization import Authorization


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


def _validate_address_bytes(data: bytes | None, field_name: str) -> None:
    """Validate address is exactly 20 bytes or None."""
    if data is not None and len(data) != 20:
        raise InvalidLengthError(
            f"{field_name} must be 20 bytes, got {len(data)}"
        )


def _validate_signature_component(data: bytes, field_name: str) -> None:
    """Validate signature component is exactly 32 bytes."""
    if len(data) != 32:
        raise InvalidLengthError(
            f"{field_name} must be 32 bytes, got {len(data)}"
        )


def _validate_hash(data: bytes, field_name: str) -> None:
    """Validate hash is exactly 32 bytes."""
    if len(data) != 32:
        raise InvalidLengthError(
            f"{field_name} must be 32 bytes, got {len(data)}"
        )


@dataclass(frozen=True, slots=True)
class LegacyTransaction:
    """
    Type 0 (legacy) transaction.

    The original Ethereum transaction format with fixed gas price.
    """

    nonce: int
    """Transaction sequence number."""

    gas_price: int
    """Gas price in wei."""

    gas_limit: int
    """Maximum gas to use."""

    to: bytes | None
    """Recipient address (20 bytes), or None for contract creation."""

    value: int
    """ETH value in wei."""

    data: bytes
    """Input data or contract bytecode."""

    v: int
    """Signature recovery id (27 or 28 for legacy, or chainId*2+35/36 for EIP-155)."""

    r: bytes
    """Signature r component (32 bytes)."""

    s: bytes
    """Signature s component (32 bytes)."""

    def __post_init__(self) -> None:
        """Validate field lengths."""
        _validate_address_bytes(self.to, "to")
        _validate_signature_component(self.r, "r")
        _validate_signature_component(self.s, "s")

    @property
    def tx_type(self) -> TransactionType:
        """Return transaction type."""
        return TransactionType.LEGACY

    def is_contract_creation(self) -> bool:
        """Check if this is a contract creation transaction."""
        return self.to is None


@dataclass(frozen=True, slots=True)
class EIP2930Transaction:
    """
    Type 1 (EIP-2930) transaction with access list.

    Adds access list support for gas optimization.
    """

    chain_id: int
    """Network chain ID."""

    nonce: int
    """Transaction sequence number."""

    gas_price: int
    """Gas price in wei."""

    gas_limit: int
    """Maximum gas to use."""

    to: bytes | None
    """Recipient address (20 bytes), or None for contract creation."""

    value: int
    """ETH value in wei."""

    data: bytes
    """Input data."""

    access_list: "AccessList"
    """Pre-declared storage access list."""

    v: int
    """y-parity (0 or 1)."""

    r: bytes
    """Signature r component (32 bytes)."""

    s: bytes
    """Signature s component (32 bytes)."""

    def __post_init__(self) -> None:
        """Validate field lengths."""
        _validate_address_bytes(self.to, "to")
        _validate_signature_component(self.r, "r")
        _validate_signature_component(self.s, "s")

    @property
    def tx_type(self) -> TransactionType:
        """Return transaction type."""
        return TransactionType.EIP2930

    def is_contract_creation(self) -> bool:
        """Check if this is a contract creation transaction."""
        return self.to is None


@dataclass(frozen=True, slots=True)
class EIP1559Transaction:
    """
    Type 2 (EIP-1559) transaction with dynamic fee market.

    Uses priority fee and max fee per gas model.
    """

    chain_id: int
    """Network chain ID."""

    nonce: int
    """Transaction sequence number."""

    max_priority_fee_per_gas: int
    """Priority fee (tip) in wei."""

    max_fee_per_gas: int
    """Maximum total fee per gas in wei."""

    gas_limit: int
    """Maximum gas to use."""

    to: bytes | None
    """Recipient address (20 bytes), or None for contract creation."""

    value: int
    """ETH value in wei."""

    data: bytes
    """Input data."""

    access_list: "AccessList"
    """Pre-declared storage access list."""

    v: int
    """y-parity (0 or 1)."""

    r: bytes
    """Signature r component (32 bytes)."""

    s: bytes
    """Signature s component (32 bytes)."""

    def __post_init__(self) -> None:
        """Validate field lengths."""
        _validate_address_bytes(self.to, "to")
        _validate_signature_component(self.r, "r")
        _validate_signature_component(self.s, "s")

    @property
    def tx_type(self) -> TransactionType:
        """Return transaction type."""
        return TransactionType.EIP1559

    def is_contract_creation(self) -> bool:
        """Check if this is a contract creation transaction."""
        return self.to is None

    def effective_gas_price(self, base_fee: int) -> int:
        """
        Calculate the effective gas price given a base fee.

        Formula: base_fee + min(max_priority_fee_per_gas, max_fee_per_gas - base_fee)

        Args:
            base_fee: The block's base fee in wei

        Returns:
            Effective gas price in wei
        """
        priority = min(self.max_priority_fee_per_gas, self.max_fee_per_gas - base_fee)
        return base_fee + priority


@dataclass(frozen=True, slots=True)
class EIP4844Transaction:
    """
    Type 3 (EIP-4844) blob transaction.

    Supports blob data for L2 scaling. Cannot be used for contract creation.
    """

    chain_id: int
    """Network chain ID."""

    nonce: int
    """Transaction sequence number."""

    max_priority_fee_per_gas: int
    """Priority fee (tip) in wei."""

    max_fee_per_gas: int
    """Maximum total fee per gas in wei."""

    gas_limit: int
    """Maximum gas to use."""

    to: bytes
    """Recipient address (20 bytes). Required - cannot be None for blob tx."""

    value: int
    """ETH value in wei."""

    data: bytes
    """Input data."""

    access_list: "AccessList"
    """Pre-declared storage access list."""

    max_fee_per_blob_gas: int
    """Maximum fee per blob gas in wei."""

    blob_versioned_hashes: tuple[bytes, ...]
    """Tuple of 32-byte versioned blob hashes."""

    v: int
    """y-parity (0 or 1)."""

    r: bytes
    """Signature r component (32 bytes)."""

    s: bytes
    """Signature s component (32 bytes)."""

    def __post_init__(self) -> None:
        """Validate field lengths and constraints."""
        # EIP-4844 requires a recipient
        if self.to is None:
            raise InvalidInputError("EIP-4844 transaction requires 'to' address (cannot be contract creation)")
        _validate_address_bytes(self.to, "to")
        _validate_signature_component(self.r, "r")
        _validate_signature_component(self.s, "s")

        # Must have at least one blob hash
        if len(self.blob_versioned_hashes) == 0:
            raise InvalidInputError("EIP-4844 transaction requires at least one blob versioned hash")

        # Validate blob hash lengths
        for i, h in enumerate(self.blob_versioned_hashes):
            if len(h) != 32:
                raise InvalidLengthError(
                    f"blob_versioned_hashes[{i}] must be 32 bytes, got {len(h)}"
                )

    @property
    def tx_type(self) -> TransactionType:
        """Return transaction type."""
        return TransactionType.EIP4844

    def is_contract_creation(self) -> bool:
        """Check if this is a contract creation transaction."""
        # EIP-4844 cannot be contract creation
        return False

    def effective_gas_price(self, base_fee: int) -> int:
        """
        Calculate the effective gas price given a base fee.

        Args:
            base_fee: The block's base fee in wei

        Returns:
            Effective gas price in wei
        """
        priority = min(self.max_priority_fee_per_gas, self.max_fee_per_gas - base_fee)
        return base_fee + priority


@dataclass(frozen=True, slots=True)
class EIP7702Transaction:
    """
    Type 4 (EIP-7702) transaction with authorization list.

    Supports EOA code delegation for account abstraction.
    """

    chain_id: int
    """Network chain ID."""

    nonce: int
    """Transaction sequence number."""

    max_priority_fee_per_gas: int
    """Priority fee (tip) in wei."""

    max_fee_per_gas: int
    """Maximum total fee per gas in wei."""

    gas_limit: int
    """Maximum gas to use."""

    to: bytes | None
    """Recipient address (20 bytes), or None for contract creation."""

    value: int
    """ETH value in wei."""

    data: bytes
    """Input data."""

    access_list: "AccessList"
    """Pre-declared storage access list."""

    authorization_list: tuple["Authorization", ...]
    """Tuple of Authorization objects for code delegation."""

    v: int
    """y-parity (0 or 1)."""

    r: bytes
    """Signature r component (32 bytes)."""

    s: bytes
    """Signature s component (32 bytes)."""

    def __post_init__(self) -> None:
        """Validate field lengths."""
        _validate_address_bytes(self.to, "to")
        _validate_signature_component(self.r, "r")
        _validate_signature_component(self.s, "s")

    @property
    def tx_type(self) -> TransactionType:
        """Return transaction type."""
        return TransactionType.EIP7702

    def is_contract_creation(self) -> bool:
        """Check if this is a contract creation transaction."""
        return self.to is None

    def effective_gas_price(self, base_fee: int) -> int:
        """
        Calculate the effective gas price given a base fee.

        Args:
            base_fee: The block's base fee in wei

        Returns:
            Effective gas price in wei
        """
        priority = min(self.max_priority_fee_per_gas, self.max_fee_per_gas - base_fee)
        return base_fee + priority


# Type alias for any transaction type
AnyTransaction = Union[
    LegacyTransaction,
    EIP2930Transaction,
    EIP1559Transaction,
    EIP4844Transaction,
    EIP7702Transaction,
]


def decode_transaction(data: bytes) -> AnyTransaction:
    """
    Decode any transaction type from raw bytes.

    Currently only detects the type. Full decoding requires additional C FFI support.

    Args:
        data: Serialized transaction bytes

    Returns:
        Transaction instance of the appropriate type

    Raises:
        NotImplementedError: Full decoding not yet implemented
    """
    tx_type = Transaction.detect_type(data)
    raise NotImplementedError(
        f"Full transaction decoding for {tx_type.name} not yet implemented. "
        "Use Transaction.detect_type() to identify the type."
    )


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


# Import AccessList after Transaction class to avoid circular import issues
# The TYPE_CHECKING block above handles the type hints
from voltaire.access_list import AccessList  # noqa: E402
