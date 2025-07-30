"""
CFFI build script for Guillotine EVM Python bindings.

This script defines the C interface and builds the FFI library.
"""

import sys
import os
from cffi import FFI

ffibuilder = FFI()

# Define the C interface based on the existing headers
ffibuilder.cdef("""
    // Error codes
    typedef enum {
        GUILLOTINE_OK = 0,
        GUILLOTINE_ERROR_MEMORY = 1,
        GUILLOTINE_ERROR_INVALID_PARAM = 2,
        GUILLOTINE_ERROR_VM_NOT_INITIALIZED = 3,
        GUILLOTINE_ERROR_EXECUTION_FAILED = 4,
        GUILLOTINE_ERROR_INVALID_ADDRESS = 5,
        GUILLOTINE_ERROR_INVALID_BYTECODE = 6,
    } GuillotineErrorCode;

    // Opaque pointer types
    typedef struct GuillotineVm GuillotineVm;
    typedef struct GuillotineDatabase GuillotineDatabase;

    // Address type (20 bytes)
    typedef struct {
        uint8_t bytes[20];
    } GuillotineAddress;

    // U256 type (32 bytes, little-endian)
    typedef struct {
        uint8_t bytes[32];
    } GuillotineU256;

    // Execution result
    typedef struct {
        bool success;
        uint64_t gas_used;
        uint8_t* output;
        size_t output_len;
        char* error_message; // NULL if no error
    } GuillotineExecutionResult;

    // VM creation and destruction
    GuillotineVm* guillotine_vm_create(void);
    void guillotine_vm_destroy(GuillotineVm* vm);

    // State management
    bool guillotine_set_balance(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* balance);
    bool guillotine_get_balance(GuillotineVm* vm, const GuillotineAddress* address, GuillotineU256* balance);
    bool guillotine_set_code(GuillotineVm* vm, const GuillotineAddress* address, const uint8_t* code, size_t code_len);
    bool guillotine_set_storage(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* key, const GuillotineU256* value);
    bool guillotine_get_storage(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* key, GuillotineU256* value);

    // Execution
    GuillotineExecutionResult guillotine_execute(
        GuillotineVm* vm,
        const GuillotineAddress* from,
        const GuillotineAddress* to,
        const GuillotineU256* value,
        const uint8_t* input,
        size_t input_len,
        uint64_t gas_limit
    );

    // Result cleanup
    void guillotine_free_result(GuillotineExecutionResult* result);

    // Utility functions
    void guillotine_address_from_bytes(const uint8_t* bytes, GuillotineAddress* address);
    void guillotine_u256_from_u64(uint64_t value, GuillotineU256* u256);
    void guillotine_u256_from_bytes(const uint8_t* bytes, GuillotineU256* u256);

    // Primitives API
    int primitives_init(void);
    void primitives_deinit(void);
    int primitives_address_from_bytes(const uint8_t* bytes_ptr, GuillotineAddress* out_ptr);
    int primitives_address_is_zero(const GuillotineAddress* addr_ptr);
    int primitives_u256_from_bytes_le(const uint8_t* bytes_ptr, GuillotineU256* out_ptr);
    int primitives_u256_to_bytes_le(const GuillotineU256* value_ptr, uint8_t* out_ptr);
    const char* primitives_version(void);

    // EVM API
    int evm_init(void);
    void evm_deinit(void);
    int evm_execute(
        const uint8_t* bytecode_ptr,
        size_t bytecode_len,
        const uint8_t* caller_ptr,
        uint64_t value,
        uint64_t gas_limit,
        GuillotineExecutionResult* result_ptr
    );
    int evm_is_initialized(void);
    const char* evm_version(void);
""")

# Determine the library path based on the build
def get_library_path():
    """Find the compiled Guillotine library."""
    # Look for the library in common build locations
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    
    # Common library names and locations
    library_names = [
        "libGuillotine.a",
        "libGuillotine.so", 
        "libGuillotine.dylib",
        "Guillotine.dll"
    ]
    
    search_paths = [
        os.path.join(project_root, "zig-out", "lib"),
        os.path.join(project_root, "zig-out", "bin"),
        os.path.join(project_root, "target", "release"),
        os.path.join(project_root, "target", "debug"),
    ]
    
    for path in search_paths:
        for lib_name in library_names:
            lib_path = os.path.join(path, lib_name)
            if os.path.exists(lib_path):
                return lib_path
    
    # If not found, try to build it
    print("Library not found. Please build the main project first with 'zig build'")
    return None

# Set up the library
library_path = get_library_path()
if library_path:
    ffibuilder.set_source(
        "guillotine_evm._ffi",
        """
        #include <stdlib.h>
        #include <string.h>
        #include <stdbool.h>
        #include <stdint.h>
        
        // Function declarations will be linked from the static library
        """,
        libraries=["Guillotine"],
        library_dirs=[os.path.dirname(library_path)] if library_path else [],
        include_dirs=[
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "src"),
        ]
    )
else:
    # Fallback for development - no actual linking
    ffibuilder.set_source(
        "guillotine_evm._ffi",
        """
        // Development mode - no actual implementation
        #include <stdlib.h>
        #include <string.h>
        #include <stdbool.h>
        #include <stdint.h>
        """
    )

if __name__ == "__main__":
    ffibuilder.compile(verbose=True)