"""
Comprehensive FFI interface for Guillotine EVM Python bindings.

This module provides complete CFFI bindings to all available Guillotine C APIs.
"""

import os
from typing import Any, Optional
from cffi import FFI

# Create FFI instance
ffi = FFI()

# Define comprehensive C interface covering all available APIs
ffi.cdef("""
    // ============================================================================
    // CORE EVM API (root.zig)
    // ============================================================================
    
    // Error codes
    typedef enum {
        GUILLOTINE_OK = 0,
        GUILLOTINE_ERROR_MEMORY = 1,
        GUILLOTINE_ERROR_INVALID_PARAM = 2,
        GUILLOTINE_ERROR_VM_NOT_INITIALIZED = 3,
        GUILLOTINE_ERROR_EXECUTION_FAILED = 4,
        GUILLOTINE_ERROR_INVALID_ADDRESS = 5,
        GUILLOTINE_ERROR_INVALID_BYTECODE = 6,
    } GuillotineError;

    // C-compatible types
    typedef struct {
        uint8_t bytes[20];
    } GuillotineAddress;

    typedef struct {
        uint8_t bytes[32];
    } GuillotineU256;

    typedef struct {
        bool success;
        uint64_t gas_used;
        uint8_t* output;
        size_t output_len;
        char* error_message;
    } GuillotineExecutionResult;
    
    typedef struct {
        int success;
        unsigned long long gas_used;
        const uint8_t* return_data_ptr;
        size_t return_data_len;
        int error_code;
    } CExecutionResult;

    // Opaque VM handle
    typedef struct GuillotineVm GuillotineVm;

    // Core functions
    int guillotine_init(void);
    void guillotine_deinit(void);
    int guillotine_is_initialized(void);
    const char* guillotine_version(void);
    
    int guillotine_execute(
        const uint8_t* bytecode_ptr,
        size_t bytecode_len,
        const uint8_t* caller_ptr,
        unsigned long long value,
        unsigned long long gas_limit,
        CExecutionResult* result_ptr
    );

    // VM instance management
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

    // ============================================================================
    // BYTECODE API (bytecode_c.zig)
    // ============================================================================

    // Error codes
    static const int EVM_BYTECODE_SUCCESS = 0;
    static const int EVM_BYTECODE_ERROR_NULL_POINTER = -1;
    static const int EVM_BYTECODE_ERROR_INVALID_BYTECODE = -2;
    static const int EVM_BYTECODE_ERROR_OUT_OF_MEMORY = -3;
    static const int EVM_BYTECODE_ERROR_BYTECODE_TOO_LARGE = -4;
    static const int EVM_BYTECODE_ERROR_INVALID_OPCODE = -5;
    static const int EVM_BYTECODE_ERROR_OUT_OF_BOUNDS = -6;

    // Opaque handle
    typedef struct BytecodeHandle BytecodeHandle;
    
    // Statistics structure
    typedef struct {
        uint32_t length;
        uint32_t instruction_count;
        uint32_t unique_opcodes;
        uint32_t push_count;
        uint32_t jump_count;
        uint32_t invalid_count;
        uint64_t estimated_gas;
    } CBytecodeStats;

    // Bytecode functions
    BytecodeHandle* evm_bytecode_create(const uint8_t* data, size_t data_len);
    void evm_bytecode_destroy(BytecodeHandle* handle);
    size_t evm_bytecode_get_length(const BytecodeHandle* handle);
    size_t evm_bytecode_get_data(const BytecodeHandle* handle, uint8_t* buffer, size_t buffer_len);
    uint8_t evm_bytecode_get_opcode_at(const BytecodeHandle* handle, size_t position);
    int evm_bytecode_is_jump_dest(const BytecodeHandle* handle, size_t position);
    uint32_t evm_bytecode_count_invalid_opcodes(const BytecodeHandle* handle);
    
    int evm_bytecode_find_jump_dests(
        const BytecodeHandle* handle,
        uint32_t* destinations,
        size_t destinations_capacity,
        size_t* destinations_count
    );
    
    int evm_bytecode_get_stats(const BytecodeHandle* handle, CBytecodeStats* stats_out);
    
    // Opcode utilities
    const char* evm_bytecode_opcode_name(uint8_t opcode_value);
    int evm_bytecode_is_valid_opcode(uint8_t opcode_value);
    const char* evm_bytecode_error_string(int error_code);

    // ============================================================================
    // PRECOMPILES API (precompiles_c.zig)
    // ============================================================================

    // Error codes
    static const int EVM_PRECOMPILE_SUCCESS = 0;
    static const int EVM_PRECOMPILE_ERROR_NULL_POINTER = -1;
    static const int EVM_PRECOMPILE_ERROR_INVALID_INPUT = -2;
    static const int EVM_PRECOMPILE_ERROR_OUT_OF_GAS = -3;
    static const int EVM_PRECOMPILE_ERROR_EXECUTION_ERROR = -4;
    static const int EVM_PRECOMPILE_ERROR_OUT_OF_MEMORY = -5;
    static const int EVM_PRECOMPILE_ERROR_NOT_PRECOMPILE = -6;
    static const int EVM_PRECOMPILE_ERROR_NOT_IMPLEMENTED = -7;

    // Precompile IDs
    static const uint8_t PRECOMPILE_ECRECOVER = 1;
    static const uint8_t PRECOMPILE_SHA256 = 2;
    static const uint8_t PRECOMPILE_RIPEMD160 = 3;
    static const uint8_t PRECOMPILE_IDENTITY = 4;
    static const uint8_t PRECOMPILE_MODEXP = 5;
    static const uint8_t PRECOMPILE_ECADD = 6;
    static const uint8_t PRECOMPILE_ECMUL = 7;
    static const uint8_t PRECOMPILE_ECPAIRING = 8;
    static const uint8_t PRECOMPILE_BLAKE2F = 9;
    static const uint8_t PRECOMPILE_POINT_EVALUATION = 10;

    // Result structure
    typedef struct {
        int success;
        uint64_t gas_used;
        uint8_t* output_ptr;
        size_t output_len;
        int error_code;
    } CPrecompileResult;

    // Address type for precompiles
    typedef struct {
        uint8_t bytes[20];
    } CAddress;

    // Address utilities
    int evm_is_precompile(const CAddress* address);
    uint8_t evm_get_precompile_id(const CAddress* address);
    int evm_create_precompile_address(uint8_t precompile_id, CAddress* address_out);

    // Precompile execution
    int evm_execute_precompile(
        const CAddress* address,
        const uint8_t* input,
        size_t input_len,
        uint64_t gas_limit,
        CPrecompileResult* result
    );
    
    int evm_execute_precompile_by_id(
        uint8_t precompile_id,
        const uint8_t* input,
        size_t input_len,
        uint64_t gas_limit,
        CPrecompileResult* result
    );

    // Individual precompiles
    int evm_ecrecover(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_sha256(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_ripemd160(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_identity(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_modexp(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_ecadd(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_ecmul(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_ecpairing(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_blake2f(const uint8_t* input, size_t input_len, CPrecompileResult* result);
    int evm_point_evaluation(const uint8_t* input, size_t input_len, CPrecompileResult* result);

    // Gas cost functions
    uint64_t evm_sha256_gas_cost(size_t input_len);
    uint64_t evm_ripemd160_gas_cost(size_t input_len);
    uint64_t evm_identity_gas_cost(size_t input_len);
    uint64_t evm_blake2f_gas_cost(uint32_t rounds);
    uint64_t evm_ecpairing_gas_cost(size_t pair_count);

    // Cleanup
    void evm_precompile_free_result(CPrecompileResult* result);
    const char* evm_precompile_error_string(int error_code);
    const char* evm_precompile_name(uint8_t precompile_id);

    // ============================================================================
    // PLANNER API (planner_c.zig)
    // ============================================================================

    // Error codes
    static const int EVM_PLANNER_SUCCESS = 0;
    static const int EVM_PLANNER_ERROR_NULL_POINTER = -1;
    static const int EVM_PLANNER_ERROR_INVALID_BYTECODE = -2;
    static const int EVM_PLANNER_ERROR_OUT_OF_MEMORY = -3;
    static const int EVM_PLANNER_ERROR_BYTECODE_TOO_LARGE = -4;
    static const int EVM_PLANNER_ERROR_PLAN_FAILED = -5;
    static const int EVM_PLANNER_ERROR_CACHE_MISS = -6;

    // Opaque handles
    typedef struct SimplePlannerHandle SimplePlannerHandle;
    typedef struct SimplePlanHandle SimplePlanHandle;
    
    // Cache statistics
    typedef struct {
        uint32_t size;
        uint32_t capacity;
        uint32_t hits;
        uint32_t misses;
    } CCacheStats;

    // Planner functions
    SimplePlannerHandle* evm_planner_create(void);
    void evm_planner_destroy(SimplePlannerHandle* handle);
    
    SimplePlanHandle* evm_planner_plan_bytecode(
        SimplePlannerHandle* planner_handle, 
        const uint8_t* bytecode, 
        size_t bytecode_len
    );
    
    void evm_planner_plan_destroy(SimplePlanHandle* handle);
    
    int evm_planner_has_cached_plan(SimplePlannerHandle* planner_handle, const uint8_t* bytecode, size_t bytecode_len);
    SimplePlanHandle* evm_planner_get_cached_plan(SimplePlannerHandle* planner_handle, const uint8_t* bytecode, size_t bytecode_len);
    int evm_planner_clear_cache(SimplePlannerHandle* planner_handle);
    int evm_planner_get_cache_stats(SimplePlannerHandle* planner_handle, CCacheStats* stats_out);
    
    // Plan inspection
    uint32_t evm_planner_plan_get_instruction_count(const SimplePlanHandle* handle);
    uint32_t evm_planner_plan_get_constant_count(const SimplePlanHandle* handle);
    int evm_planner_plan_has_pc_mapping(const SimplePlanHandle* handle);
    int evm_planner_plan_is_valid_jump_dest(const SimplePlanHandle* handle, uint32_t pc);
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
    
    # Try Windows DLL
    lib_path = os.path.join(project_root, "zig-out", "lib", "Guillotine.dll")
    if os.path.exists(lib_path):
        return lib_path
    
    return None

# Try to load the library
library_path = get_library_path()
lib = None

if library_path and os.path.exists(library_path):
    try:
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