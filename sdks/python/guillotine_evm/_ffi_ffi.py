"""
New FFI bindings aligned with src/evm_c_api.zig (guillotine_ffi).

This module loads the shared library built by `zig build` (name: guillotine_ffi)
and exposes the C ABI used by the Bun SDK so Python can target the same API.
"""

from __future__ import annotations

import os
import sys
from typing import Optional
from cffi import FFI

ffi = FFI()

# Mirror the C ABI defined in src/evm_c_api.zig
ffi.cdef(
    """
    typedef struct EvmHandle EvmHandle;

    typedef struct {
        bool success;
        unsigned long long gas_left;
        const unsigned char* output;
        size_t output_len;
        const char* error_message; // null-terminated if present
    } EvmResult;

    typedef struct {
        unsigned char caller[20];
        unsigned char to[20];
        unsigned char value[32]; // big-endian u256
        const unsigned char* input;
        size_t input_len;
        unsigned long long gas;
        unsigned char call_type; // 0..4
        unsigned char salt[32];  // big-endian u256
    } CallParams;

    typedef struct {
        unsigned long long number;
        unsigned long long timestamp;
        unsigned long long gas_limit;
        unsigned char coinbase[20];
        unsigned long long base_fee;
        unsigned long long chain_id;
        unsigned long long difficulty;
        unsigned char prev_randao[32];
    } BlockInfoFFI;

    void guillotine_init(void);
    void guillotine_cleanup(void);

    EvmHandle* guillotine_evm_create(const BlockInfoFFI* block_info);
    void guillotine_evm_destroy(EvmHandle* handle);

    bool guillotine_set_balance(EvmHandle* handle, const unsigned char* address20, const unsigned char* balance32);
    bool guillotine_set_code(EvmHandle* handle, const unsigned char* address20, const unsigned char* code, size_t code_len);

    EvmResult* guillotine_call(EvmHandle* handle, const CallParams* params);
    EvmResult* guillotine_simulate(EvmHandle* handle, const CallParams* params);

    void guillotine_free_output(unsigned char* output, size_t len);
    void guillotine_free_result(EvmResult* result);

    const char* guillotine_get_last_error(void);
    """
)


def _lib_path() -> Optional[str]:
    """Return absolute path to the built shared library if present."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    candidates = []
    libdir = os.path.join(project_root, "zig-out", "lib")
    # macOS
    candidates.append(os.path.join(libdir, "libguillotine_ffi.dylib"))
    # Linux
    candidates.append(os.path.join(libdir, "libguillotine_ffi.so"))
    # Windows
    candidates.append(os.path.join(libdir, "guillotine_ffi.dll"))
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


_LIB_PATH = _lib_path()
lib = None

try:
    if _LIB_PATH is None:
        raise FileNotFoundError("guillotine_ffi shared library not found. Run `zig build`.")
    lib = ffi.dlopen(_LIB_PATH)
    # ensure allocator is initialized similar to Bun SDK
    lib.guillotine_init()
except Exception as e:
    sys.stderr.write(f"[guillotine_ffi] Failed to load: {_LIB_PATH} ({e})\n")
    lib = None


def is_ffi_available() -> bool:
    return lib is not None


def require_ffi() -> None:
    if lib is None:
        raise RuntimeError("Native library not available. Please run `zig build` first.")

