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


# Lazy-loaded library instance
_lib: Optional[ctypes.CDLL] = None


def get_lib() -> ctypes.CDLL:
    """Get the loaded library instance (lazy loading)."""
    global _lib
    if _lib is None:
        _lib = _load_library()
    return _lib
