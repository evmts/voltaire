"""
FFI loader for Voltaire native library.

Handles loading the shared library and defining C function signatures.
"""

import ctypes
import os
import platform
import sys
from ctypes import (
    POINTER,
    Structure,
    c_bool,
    c_char_p,
    c_int,
    c_int64,
    c_longlong,
    c_size_t,
    c_uint8,
    c_uint32,
    c_uint64,
)
from pathlib import Path
from typing import Optional

# Type aliases
c_uint8_p = POINTER(c_uint8)
c_uint8_array_20 = c_uint8 * 20
c_uint8_array_32 = c_uint8 * 32
c_uint8_array_64 = c_uint8 * 64
c_uint8_array_65 = c_uint8 * 65
c_uint8_array_33 = c_uint8 * 33
c_uint8_array_4 = c_uint8 * 4


# C-compatible structs
class PrimitivesAddress(Structure):
    """20-byte Ethereum address."""

    _fields_ = [("bytes", c_uint8 * 20)]


class PrimitivesHash(Structure):
    """32-byte hash (Keccak-256, SHA-256, etc.)."""

    _fields_ = [("bytes", c_uint8 * 32)]


class PrimitivesU256(Structure):
    """32-byte unsigned integer (big-endian)."""

    _fields_ = [("bytes", c_uint8 * 32)]


class PrimitivesSignature(Structure):
    """65-byte ECDSA signature (r + s + v)."""

    _fields_ = [
        ("r", c_uint8 * 32),
        ("s", c_uint8 * 32),
        ("v", c_uint8),
    ]


class PrimitivesAccessListEntry(Structure):
    """Access list entry (EIP-2930)."""

    _fields_ = [
        ("address", PrimitivesAddress),
        ("storage_keys_ptr", POINTER(PrimitivesHash)),
        ("storage_keys_len", c_size_t),
    ]


class PrimitivesAuthorization(Structure):
    """Authorization structure (EIP-7702)."""

    _fields_ = [
        ("chain_id", c_uint64),
        ("address", PrimitivesAddress),
        ("nonce", c_uint64),
        ("v", c_uint64),
        ("r", c_uint8 * 32),
        ("s", c_uint8 * 32),
    ]


class InstructionData(Structure):
    """Bytecode instruction data (packed struct)."""

    _pack_ = 1
    _fields_ = [
        ("pc", c_uint32),
        ("opcode", c_uint8),
        ("push_size", c_uint8),
        ("_padding", c_uint8 * 2),
    ]


class FusionPattern(Structure):
    """Bytecode fusion pattern (packed struct)."""

    _pack_ = 1
    _fields_ = [
        ("pc", c_uint32),
        ("pattern_type", c_uint8),
        ("first_opcode", c_uint8),
        ("second_opcode", c_uint8),
    ]


def _find_library() -> Optional[Path]:
    """
    Find the Voltaire shared library.

    Search order:
    1. VOLTAIRE_LIB_PATH environment variable
    2. Package directory
    3. Build output directories
    4. System library paths
    """
    # Check environment variable
    env_path = os.environ.get("VOLTAIRE_LIB_PATH")
    if env_path:
        path = Path(env_path)
        if path.exists():
            return path

    # Determine library name by platform
    system = platform.system()
    if system == "Darwin":
        lib_names = ["libprimitives_ts_native.dylib", "libprimitives.dylib"]
    elif system == "Windows":
        lib_names = ["primitives_ts_native.dll", "primitives.dll"]
    else:
        lib_names = ["libprimitives_ts_native.so", "libprimitives.so"]

    # Search paths for each library name
    search_paths = []
    for lib_name in lib_names:
        search_paths.extend([
            # Package lib directory
            Path(__file__).parent / "lib" / lib_name,
            # Root zig-out/native (primary location)
            Path(__file__).parents[4] / "zig-out" / "native" / lib_name,
            # Build output (relative to package root)
            Path(__file__).parents[4] / "zig-out" / "lib" / lib_name,
            # voltaire-zig build output
            Path(__file__).parents[4] / "packages" / "voltaire-zig" / "zig-out" / "lib" / lib_name,
            Path(__file__).parents[4] / "packages" / "voltaire-zig" / "zig-out" / "native" / lib_name,
            # Root zig-out
            Path(__file__).parents[5] / "zig-out" / "lib" / lib_name,
            Path(__file__).parents[5] / "zig-out" / "native" / lib_name,
        ])

    for path in search_paths:
        if path.exists():
            return path

    return None


def _load_library() -> ctypes.CDLL:
    """Load the Voltaire shared library."""
    lib_path = _find_library()

    if lib_path is None:
        raise OSError(
            "Could not find Voltaire native library. "
            "Set VOLTAIRE_LIB_PATH or run 'zig build build-ts-native' first."
        )

    try:
        lib = ctypes.CDLL(str(lib_path))
    except OSError as e:
        raise OSError(f"Failed to load Voltaire library from {lib_path}: {e}") from e

    _setup_function_signatures(lib)
    return lib


def _setup_function_signatures(lib: ctypes.CDLL) -> None:
    """Define C function signatures for type safety."""

    # Address functions
    lib.primitives_address_from_hex.argtypes = [c_char_p, POINTER(PrimitivesAddress)]
    lib.primitives_address_from_hex.restype = c_int

    lib.primitives_address_to_hex.argtypes = [POINTER(PrimitivesAddress), c_char_p]
    lib.primitives_address_to_hex.restype = c_int

    lib.primitives_address_to_checksum_hex.argtypes = [POINTER(PrimitivesAddress), c_char_p]
    lib.primitives_address_to_checksum_hex.restype = c_int

    lib.primitives_address_is_zero.argtypes = [POINTER(PrimitivesAddress)]
    lib.primitives_address_is_zero.restype = c_bool

    lib.primitives_address_equals.argtypes = [POINTER(PrimitivesAddress), POINTER(PrimitivesAddress)]
    lib.primitives_address_equals.restype = c_bool

    lib.primitives_address_validate_checksum.argtypes = [c_char_p]
    lib.primitives_address_validate_checksum.restype = c_bool

    # Hash functions
    lib.primitives_keccak256.argtypes = [c_uint8_p, c_size_t, POINTER(PrimitivesHash)]
    lib.primitives_keccak256.restype = c_int

    lib.primitives_hash_to_hex.argtypes = [POINTER(PrimitivesHash), c_char_p]
    lib.primitives_hash_to_hex.restype = c_int

    lib.primitives_hash_from_hex.argtypes = [c_char_p, POINTER(PrimitivesHash)]
    lib.primitives_hash_from_hex.restype = c_int

    lib.primitives_hash_equals.argtypes = [POINTER(PrimitivesHash), POINTER(PrimitivesHash)]
    lib.primitives_hash_equals.restype = c_bool

    # SHA-256
    lib.primitives_sha256.argtypes = [c_uint8_p, c_size_t, POINTER(c_uint8 * 32)]
    lib.primitives_sha256.restype = c_int

    # Hex utilities
    lib.primitives_hex_to_bytes.argtypes = [c_char_p, c_uint8_p, c_size_t]
    lib.primitives_hex_to_bytes.restype = c_int

    lib.primitives_bytes_to_hex.argtypes = [c_uint8_p, c_size_t, c_char_p, c_size_t]
    lib.primitives_bytes_to_hex.restype = c_int

    # U256 functions
    lib.primitives_u256_from_hex.argtypes = [c_char_p, POINTER(PrimitivesU256)]
    lib.primitives_u256_from_hex.restype = c_int

    lib.primitives_u256_to_hex.argtypes = [POINTER(PrimitivesU256), c_char_p, c_size_t]
    lib.primitives_u256_to_hex.restype = c_int

    # EIP-191
    lib.primitives_eip191_hash_message.argtypes = [c_uint8_p, c_size_t, POINTER(PrimitivesHash)]
    lib.primitives_eip191_hash_message.restype = c_int

    # secp256k1
    lib.primitives_secp256k1_recover_pubkey.argtypes = [
        POINTER(c_uint8 * 32),  # message_hash
        POINTER(c_uint8 * 32),  # r
        POINTER(c_uint8 * 32),  # s
        c_uint8,  # v
        POINTER(c_uint8 * 64),  # out_pubkey
    ]
    lib.primitives_secp256k1_recover_pubkey.restype = c_int

    lib.primitives_secp256k1_recover_address.argtypes = [
        POINTER(c_uint8 * 32),
        POINTER(c_uint8 * 32),
        POINTER(c_uint8 * 32),
        c_uint8,
        POINTER(PrimitivesAddress),
    ]
    lib.primitives_secp256k1_recover_address.restype = c_int

    lib.primitives_secp256k1_pubkey_from_private.argtypes = [
        POINTER(c_uint8 * 32),
        POINTER(c_uint8 * 64),
    ]
    lib.primitives_secp256k1_pubkey_from_private.restype = c_int

    # Key generation
    lib.primitives_generate_private_key.argtypes = [POINTER(c_uint8 * 32)]
    lib.primitives_generate_private_key.restype = c_int

    # Public key compression
    lib.primitives_compress_public_key.argtypes = [
        POINTER(c_uint8 * 64),  # uncompressed
        POINTER(c_uint8 * 33),  # out_compressed
    ]
    lib.primitives_compress_public_key.restype = c_int

    # CREATE address
    lib.primitives_calculate_create_address.argtypes = [
        POINTER(PrimitivesAddress),
        c_uint64,
        POINTER(PrimitivesAddress),
    ]
    lib.primitives_calculate_create_address.restype = c_int

    # RLP functions
    lib.primitives_rlp_encode_bytes.argtypes = [
        c_uint8_p,  # data
        c_size_t,   # data_len
        c_char_p,   # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_rlp_encode_bytes.restype = c_int

    lib.primitives_rlp_encode_uint.argtypes = [
        POINTER(c_uint8 * 32),  # value_bytes (big-endian u256)
        c_char_p,               # out_buf
        c_size_t,               # buf_len
    ]
    lib.primitives_rlp_encode_uint.restype = c_int

    lib.primitives_rlp_to_hex.argtypes = [
        c_uint8_p,  # rlp_data
        c_size_t,   # rlp_len
        c_char_p,   # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_rlp_to_hex.restype = c_int

    lib.primitives_rlp_from_hex.argtypes = [
        c_char_p,   # hex (null-terminated)
        c_char_p,   # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_rlp_from_hex.restype = c_int

    # Transaction functions
    lib.primitives_tx_detect_type.argtypes = [
        c_uint8_p,  # data
        c_size_t,   # data_len
    ]
    lib.primitives_tx_detect_type.restype = c_int

    # CREATE2 address
    lib.primitives_calculate_create2_address.argtypes = [
        POINTER(PrimitivesAddress),  # sender
        POINTER(c_uint8 * 32),       # salt (32 bytes)
        c_uint8_p,                   # init_code
        c_size_t,                    # init_code_len
        POINTER(PrimitivesAddress),  # out_address
    ]
    lib.primitives_calculate_create2_address.restype = c_int

    # BLAKE2b (64-byte output)
    lib.primitives_blake2b.argtypes = [c_uint8_p, c_size_t, POINTER(c_uint8 * 64)]
    lib.primitives_blake2b.restype = c_int

    # RIPEMD160 (20-byte output)
    lib.primitives_ripemd160.argtypes = [c_uint8_p, c_size_t, POINTER(c_uint8 * 20)]
    lib.primitives_ripemd160.restype = c_int

    # ABI functions
    lib.primitives_abi_compute_selector.argtypes = [
        c_char_p,               # signature (null-terminated)
        POINTER(c_uint8 * 4),   # out_selector
    ]
    lib.primitives_abi_compute_selector.restype = c_int

    lib.primitives_abi_decode_parameters.argtypes = [
        c_uint8_p,   # data
        c_size_t,    # data_len
        c_char_p,    # types_json (null-terminated)
        c_char_p,    # out_buf
        c_size_t,    # buf_len
    ]
    lib.primitives_abi_decode_parameters.restype = c_int

    lib.primitives_abi_decode_function_data.argtypes = [
        c_uint8_p,              # data
        c_size_t,               # data_len
        c_char_p,               # types_json (null-terminated)
        POINTER(c_uint8 * 4),   # out_selector
        c_char_p,               # out_buf
        c_size_t,               # buf_len
    ]
    lib.primitives_abi_decode_function_data.restype = c_int

    lib.primitives_abi_encode_parameters.argtypes = [
        c_char_p,   # types_json (null-terminated)
        c_char_p,   # values_json (null-terminated)
        c_uint8_p,  # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_abi_encode_parameters.restype = c_int

    lib.primitives_abi_encode_function_data.argtypes = [
        c_char_p,   # signature (null-terminated)
        c_char_p,   # types_json (null-terminated)
        c_char_p,   # values_json (null-terminated)
        c_uint8_p,  # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_abi_encode_function_data.restype = c_int

    lib.primitives_abi_encode_packed.argtypes = [
        c_char_p,   # types_json (null-terminated)
        c_char_p,   # values_json (null-terminated)
        c_uint8_p,  # out_buf
        c_size_t,   # buf_len
    ]
    lib.primitives_abi_encode_packed.restype = c_int

    lib.primitives_abi_estimate_gas.argtypes = [
        c_uint8_p,  # data
        c_size_t,   # data_len
    ]
    lib.primitives_abi_estimate_gas.restype = c_longlong

    # Bytecode analysis functions
    lib.primitives_bytecode_analyze_jumpdests.argtypes = [
        c_uint8_p,              # code
        c_size_t,               # code_len
        POINTER(c_uint32),      # out_jumpdests
        c_size_t,               # max_jumpdests
    ]
    lib.primitives_bytecode_analyze_jumpdests.restype = c_int

    lib.primitives_bytecode_is_boundary.argtypes = [
        c_uint8_p,              # code
        c_size_t,               # code_len
        c_uint32,               # position
    ]
    lib.primitives_bytecode_is_boundary.restype = c_bool

    lib.primitives_bytecode_is_valid_jumpdest.argtypes = [
        c_uint8_p,              # code
        c_size_t,               # code_len
        c_uint32,               # position
    ]
    lib.primitives_bytecode_is_valid_jumpdest.restype = c_bool

    lib.primitives_bytecode_validate.argtypes = [
        c_uint8_p,              # code
        c_size_t,               # code_len
    ]
    lib.primitives_bytecode_validate.restype = c_int

    lib.primitives_bytecode_get_next_pc.argtypes = [
        c_uint8_p,              # code
        c_size_t,               # code_len
        c_uint32,               # current_pc
    ]
    lib.primitives_bytecode_get_next_pc.restype = c_int64

    # Blob functions (EIP-4844)
    lib.primitives_blob_from_data.argtypes = [c_uint8_p, c_size_t, c_uint8_p]
    lib.primitives_blob_from_data.restype = c_int

    lib.primitives_blob_to_data.argtypes = [c_uint8_p, c_uint8_p, POINTER(c_size_t)]
    lib.primitives_blob_to_data.restype = c_int

    lib.primitives_blob_is_valid.argtypes = [c_size_t]
    lib.primitives_blob_is_valid.restype = c_int

    lib.primitives_blob_calculate_gas.argtypes = [c_uint32]
    lib.primitives_blob_calculate_gas.restype = c_uint64

    lib.primitives_blob_estimate_count.argtypes = [c_size_t]
    lib.primitives_blob_estimate_count.restype = c_uint32

    lib.primitives_blob_calculate_gas_price.argtypes = [c_uint64]
    lib.primitives_blob_calculate_gas_price.restype = c_uint64

    lib.primitives_blob_calculate_excess_gas.argtypes = [c_uint64, c_uint64]
    lib.primitives_blob_calculate_excess_gas.restype = c_uint64

    # Signature utilities
    lib.primitives_secp256k1_validate_signature.argtypes = [
        POINTER(c_uint8 * 32),  # r
        POINTER(c_uint8 * 32),  # s
    ]
    lib.primitives_secp256k1_validate_signature.restype = c_bool

    lib.primitives_signature_normalize.argtypes = [
        POINTER(c_uint8 * 32),  # r (unused but required)
        POINTER(c_uint8 * 32),  # s (modified in place)
    ]
    lib.primitives_signature_normalize.restype = c_bool

    lib.primitives_signature_is_canonical.argtypes = [
        POINTER(c_uint8 * 32),  # r
        POINTER(c_uint8 * 32),  # s
    ]
    lib.primitives_signature_is_canonical.restype = c_bool

    lib.primitives_signature_parse.argtypes = [
        c_uint8_p,              # sig_data
        c_size_t,               # sig_len
        POINTER(c_uint8 * 32),  # out_r
        POINTER(c_uint8 * 32),  # out_s
        POINTER(c_uint8),       # out_v
    ]
    lib.primitives_signature_parse.restype = c_int

    lib.primitives_signature_serialize.argtypes = [
        POINTER(c_uint8 * 32),  # r
        POINTER(c_uint8 * 32),  # s
        c_uint8,                # v
        c_bool,                 # include_v
        c_uint8_p,              # out_buf
    ]
    lib.primitives_signature_serialize.restype = c_int

    # Wallet generation
    lib.primitives_generate_private_key.argtypes = [
        POINTER(c_uint8 * 32),  # out_private_key
    ]
    lib.primitives_generate_private_key.restype = c_int

    lib.primitives_compress_public_key.argtypes = [
        POINTER(c_uint8 * 64),  # uncompressed
        POINTER(c_uint8 * 33),  # out_compressed
    ]
    lib.primitives_compress_public_key.restype = c_int

    # Solidity-style hashing
    lib.primitives_solidity_keccak256.argtypes = [
        c_uint8_p,              # packed_data
        c_size_t,               # data_len
        POINTER(PrimitivesHash),  # out_hash
    ]
    lib.primitives_solidity_keccak256.restype = c_int

    lib.primitives_solidity_sha256.argtypes = [
        c_uint8_p,              # packed_data
        c_size_t,               # data_len
        POINTER(c_uint8 * 32),  # out_hash
    ]
    lib.primitives_solidity_sha256.restype = c_int

    # Event log matching
    lib.primitives_eventlog_matches_address.argtypes = [
        POINTER(c_uint8 * 20),  # log_address
        c_uint8_p,              # filter_addresses (array of 20-byte addresses)
        c_size_t,               # filter_count
    ]
    lib.primitives_eventlog_matches_address.restype = c_int

    lib.primitives_eventlog_matches_topic.argtypes = [
        POINTER(c_uint8 * 32),  # log_topic
        POINTER(c_uint8 * 32),  # filter_topic
        c_int,                  # null_topic (1 = null filter, 0 = specific filter)
    ]
    lib.primitives_eventlog_matches_topic.restype = c_int

    lib.primitives_eventlog_matches_topics.argtypes = [
        c_uint8_p,              # log_topics (array of 32-byte topics)
        c_size_t,               # log_topic_count
        c_uint8_p,              # filter_topics (array of 32-byte topics)
        POINTER(c_int),         # filter_nulls (array of int flags)
        c_size_t,               # filter_count
    ]
    lib.primitives_eventlog_matches_topics.restype = c_int

    # Version
    lib.primitives_version_string.argtypes = []
    lib.primitives_version_string.restype = c_char_p

    # Access list (EIP-2930)
    lib.primitives_access_list_gas_cost.argtypes = [
        POINTER(PrimitivesAccessListEntry),  # entries
        c_size_t,                            # entries_len
        POINTER(c_uint64),                   # out_cost
    ]
    lib.primitives_access_list_gas_cost.restype = c_int

    # Authorization (EIP-7702)
    lib.primitives_authorization_validate.argtypes = [
        POINTER(PrimitivesAuthorization),  # auth_ptr
    ]
    lib.primitives_authorization_validate.restype = c_int

    lib.primitives_authorization_signing_hash.argtypes = [
        c_uint64,                   # chain_id
        POINTER(PrimitivesAddress), # address_ptr
        c_uint64,                   # nonce
        POINTER(PrimitivesHash),    # out_hash
    ]
    lib.primitives_authorization_signing_hash.restype = c_int

    lib.primitives_authorization_authority.argtypes = [
        POINTER(PrimitivesAuthorization),  # auth_ptr
        POINTER(PrimitivesAddress),        # out_address
    ]
    lib.primitives_authorization_authority.restype = c_int

    lib.primitives_authorization_gas_cost.argtypes = [
        c_size_t,  # count
        c_size_t,  # empty_accounts
    ]
    lib.primitives_authorization_gas_cost.restype = c_uint64

    # Advanced bytecode analysis
    lib.primitives_bytecode_scan.argtypes = [
        c_uint8_p,          # code
        c_size_t,           # code_len
        c_uint32,           # start_pc
        c_uint32,           # end_pc
        c_uint8_p,          # out_instructions (InstructionData array)
        POINTER(c_size_t),  # out_len (in: buffer size, out: bytes written)
    ]
    lib.primitives_bytecode_scan.restype = c_int

    lib.primitives_bytecode_detect_fusions.argtypes = [
        c_uint8_p,          # code
        c_size_t,           # code_len
        c_uint8_p,          # out_fusions (FusionPattern array)
        POINTER(c_size_t),  # out_len (in: buffer size, out: bytes written)
    ]
    lib.primitives_bytecode_detect_fusions.restype = c_int


# Lazy-loaded library instance
_lib: Optional[ctypes.CDLL] = None


def get_lib() -> ctypes.CDLL:
    """Get the loaded library instance (lazy loading)."""
    global _lib
    if _lib is None:
        _lib = _load_library()
    return _lib


def get_version() -> str:
    """Get Voltaire native library version."""
    lib = get_lib()
    return lib.primitives_version_string().decode("utf-8")
