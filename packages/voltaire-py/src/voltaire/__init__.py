"""
Voltaire - Python bindings for Ethereum primitives and cryptography.

High-performance, type-safe Ethereum utilities powered by native Zig/C FFI.

Example:
    >>> from voltaire import Address, keccak256
    >>> addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
    >>> hash = keccak256(b"hello")
"""

from voltaire._version import __version__
from voltaire.errors import (
    VoltaireError,
    InvalidHexError,
    InvalidLengthError,
    InvalidChecksumError,
    InvalidSignatureError,
    InvalidInputError,
    InvalidAuthorizationError,
)

__all__ = [
    # Version
    "__version__",
    # Errors
    "VoltaireError",
    "InvalidHexError",
    "InvalidLengthError",
    "InvalidChecksumError",
    "InvalidSignatureError",
    "InvalidInputError",
    "InvalidAuthorizationError",
]

# Core primitives - import implemented modules
try:
    from voltaire.address import Address
    __all__.append("Address")
except (ImportError, NotImplementedError):
    pass

try:
    from voltaire.hash import (
        Hash,
        keccak256,
        sha256,
        eip191_hash_message,
        blake2b,
        ripemd160,
        solidity_keccak256,
        solidity_sha256,
    )
    __all__.extend([
        "Hash",
        "keccak256",
        "sha256",
        "eip191_hash_message",
        "blake2b",
        "ripemd160",
        "solidity_keccak256",
        "solidity_sha256",
    ])
except (ImportError, NotImplementedError):
    pass

try:
    from voltaire.hex import Hex, hex_encode, hex_decode
    __all__.extend(["Hex", "hex_encode", "hex_decode"])
except (ImportError, NotImplementedError):
    pass

try:
    from voltaire.uint256 import Uint256
    __all__.append("Uint256")
except (ImportError, NotImplementedError):
    pass

# Cryptography
try:
    from voltaire.secp256k1 import Secp256k1, Signature
    __all__.extend(["Secp256k1", "Signature"])
except (ImportError, NotImplementedError):
    pass

try:
    from voltaire.signature import SignatureComponents, SignatureUtils
    __all__.extend(["SignatureComponents", "SignatureUtils"])
except (ImportError, NotImplementedError):
    pass

# Encoding
try:
    from voltaire.rlp import Rlp, rlp_encode
    __all__.extend(["Rlp", "rlp_encode"])
except (ImportError, NotImplementedError):
    pass

# Transaction utilities
try:
    from voltaire.transaction import (
        Transaction,
        TransactionType,
        LegacyTransaction,
        EIP2930Transaction,
        EIP1559Transaction,
        EIP4844Transaction,
        EIP7702Transaction,
        decode_transaction,
    )
    __all__.extend([
        "Transaction",
        "TransactionType",
        "LegacyTransaction",
        "EIP2930Transaction",
        "EIP1559Transaction",
        "EIP4844Transaction",
        "EIP7702Transaction",
        "decode_transaction",
    ])
except (ImportError, NotImplementedError):
    pass

# Access lists
try:
    from voltaire.access_list import (
        AccessList,
        AccessListEntry,
        ADDRESS_COST,
        STORAGE_KEY_COST,
        COLD_ACCOUNT_ACCESS_COST,
        COLD_STORAGE_ACCESS_COST,
        WARM_STORAGE_ACCESS_COST,
    )
    __all__.extend([
        "AccessList",
        "AccessListEntry",
        "ADDRESS_COST",
        "STORAGE_KEY_COST",
        "COLD_ACCOUNT_ACCESS_COST",
        "COLD_STORAGE_ACCESS_COST",
        "WARM_STORAGE_ACCESS_COST",
    ])
except (ImportError, NotImplementedError):
    pass

# Event logs
try:
    from voltaire.eventlog import EventLog, LogFilter, filter_logs, sort_logs
    __all__.extend(["EventLog", "LogFilter", "filter_logs", "sort_logs"])
except (ImportError, NotImplementedError):
    pass

# ABI encoding/decoding
try:
    from voltaire.abi import Abi
    __all__.append("Abi")
except (ImportError, NotImplementedError):
    pass

# EIP-7702 Authorization
try:
    from voltaire.authorization import (
        Authorization,
        MAGIC_BYTE,
        PER_AUTH_BASE_COST,
        PER_EMPTY_ACCOUNT_COST,
        SECP256K1_N,
        SECP256K1_HALF_N,
    )
    __all__.extend([
        "Authorization",
        "MAGIC_BYTE",
        "PER_AUTH_BASE_COST",
        "PER_EMPTY_ACCOUNT_COST",
        "SECP256K1_N",
        "SECP256K1_HALF_N",
    ])
except (ImportError, NotImplementedError):
    pass

# Bytecode analysis
try:
    from voltaire.bytecode import Bytecode
    __all__.append("Bytecode")
except (ImportError, NotImplementedError):
    pass

# Blobs (EIP-4844)
try:
    from voltaire.blob import (
        Blob,
        BLOB_SIZE,
        FIELD_ELEMENTS_PER_BLOB,
        BYTES_PER_FIELD_ELEMENT,
        MAX_DATA_PER_BLOB,
        GAS_PER_BLOB,
        TARGET_BLOBS_PER_BLOCK,
    )
    __all__.extend([
        "Blob",
        "BLOB_SIZE",
        "FIELD_ELEMENTS_PER_BLOB",
        "BYTES_PER_FIELD_ELEMENT",
        "MAX_DATA_PER_BLOB",
        "GAS_PER_BLOB",
        "TARGET_BLOBS_PER_BLOCK",
    ])
except (ImportError, NotImplementedError):
    pass
