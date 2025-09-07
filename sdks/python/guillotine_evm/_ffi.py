"""
Real FFI interface for Guillotine EVM Python bindings.

This module provides the actual CFFI interface to the native Guillotine library.
"""

import os
import sys
from typing import Any, Optional
from cffi import FFI

# Create FFI instance
ffi = FFI()

# Define the C interface based on the actual root.zig exports
ffi.cdef("""
    // Error codes matching GuillotineError enum
    typedef enum {
        GUILLOTINE_OK = 0,
        GUILLOTINE_ERROR_MEMORY = 1,
        GUILLOTINE_ERROR_INVALID_PARAM = 2,
        GUILLOTINE_ERROR_VM_NOT_INITIALIZED = 3,
        GUILLOTINE_ERROR_EXECUTION_FAILED = 4,
        GUILLOTINE_ERROR_INVALID_ADDRESS = 5,
        GUILLOTINE_ERROR_INVALID_BYTECODE = 6,
    } GuillotineError;

    // C-compatible execution result (from root.zig)
    typedef struct {
        int success;
        unsigned long long gas_used;
        const uint8_t* return_data_ptr;
        size_t return_data_len;
        int error_code;
    } CExecutionResult;

    // Core EVM functions (from root.zig)
    int guillotine_init(void);
    void guillotine_deinit(void);
    int guillotine_execute(
        const uint8_t* bytecode_ptr,
        size_t bytecode_len,
        const uint8_t* caller_ptr,
        unsigned long long value,
        unsigned long long gas_limit,
        CExecutionResult* result_ptr
    );
    int guillotine_is_initialized(void);
    const char* guillotine_version(void);

    // Opaque pointer types
    typedef struct GuillotineVm GuillotineVm;

    // Address type (20 bytes)
    typedef struct {
        uint8_t bytes[20];
    } GuillotineAddress;

    // U256 type (32 bytes, little-endian)
    typedef struct {
        uint8_t bytes[32];
    } GuillotineU256;

    // Execution result for VM-specific functions
    typedef struct {
        bool success;
        uint64_t gas_used;
        uint8_t* output;
        size_t output_len;
        char* error_message;
    } GuillotineExecutionResult;

    // VM management functions (from root.zig)
    GuillotineVm* guillotine_vm_create(void);
    void guillotine_vm_destroy(GuillotineVm* vm);
    bool guillotine_set_balance(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* balance);
    bool guillotine_set_code(GuillotineVm* vm, const GuillotineAddress* address, const uint8_t* code, size_t code_len);
    GuillotineExecutionResult guillotine_vm_execute(
        GuillotineVm* vm,
        const GuillotineAddress* from,
        const GuillotineAddress* to,
        const GuillotineU256* value,
        const uint8_t* input,
        size_t input_len,
        uint64_t gas_limit
    );
""")

def get_library_path():
    """Find the compiled Guillotine library."""
    # Look for the library in the main project
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    # Standard location after zig build - use shared library for FFI
    lib_path = os.path.join(project_root, "zig-out", "lib", "libGuillotine.dylib")
    
    if os.path.exists(lib_path):
        return lib_path
    
    # Fallback to .so on Linux
    lib_path = os.path.join(project_root, "zig-out", "lib", "libGuillotine.so")
    if os.path.exists(lib_path):
        return lib_path
    
    return None

# Try to load the library
library_path = get_library_path()
lib = None

if library_path and os.path.exists(library_path):
    try:
        # Load the static library
        lib = ffi.dlopen(library_path)
        _FFI_AVAILABLE = True
        print(f"Successfully loaded Guillotine library from {library_path}")
    except Exception as e:
        print(f"Failed to load library from {library_path}: {e}")
        _FFI_AVAILABLE = False
        lib = None
else:
    print(f"Library not found at expected path: {library_path}")
    _FFI_AVAILABLE = False
    lib = None

def is_ffi_available() -> bool:
    """Check if the native FFI library is available."""
    return _FFI_AVAILABLE and lib is not None

def require_ffi() -> None:
    """Require FFI to be available, raise error if not."""
    if not is_ffi_available():
        raise RuntimeError(
            "Native Guillotine library not available. "
            "Please build the project with 'zig build' first."
        )