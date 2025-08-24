#ifndef EVM2_C_H
#define EVM2_C_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

// ============================================================================
// LIBRARY METADATA
// ============================================================================

/// Get library version string
const char* evm2_version(void);

/// Get library build info
const char* evm2_build_info(void);

/// Initialize library (currently a no-op)
int evm2_init(void);

/// Cleanup library resources (currently a no-op)
void evm2_cleanup(void);

// ============================================================================
// ERROR CODES
// ============================================================================

#define EVM_SUCCESS                 0
#define EVM_ERROR_STACK_OVERFLOW   -1
#define EVM_ERROR_STACK_UNDERFLOW  -2
#define EVM_ERROR_OUT_OF_GAS       -3
#define EVM_ERROR_INVALID_JUMP     -4
#define EVM_ERROR_INVALID_OPCODE   -5
#define EVM_ERROR_OUT_OF_BOUNDS    -6
#define EVM_ERROR_ALLOCATION       -7
#define EVM_ERROR_BYTECODE_TOO_LARGE -8
#define EVM_ERROR_STOP             -9
#define EVM_ERROR_NULL_POINTER     -10

// ============================================================================
// OPAQUE TYPES
// ============================================================================

/// Opaque EVM frame handle
typedef void* evm_frame_t;

// ============================================================================
// FRAME LIFECYCLE
// ============================================================================

/// Create a new EVM frame with the given bytecode and initial gas
/// @param bytecode Pointer to bytecode array
/// @param bytecode_len Length of bytecode in bytes
/// @param initial_gas Initial gas amount
/// @return Opaque frame handle, or NULL on failure
evm_frame_t evm_frame_create(
    const uint8_t* bytecode,
    size_t bytecode_len,
    uint64_t initial_gas
);

/// Destroy frame and free all associated memory
/// @param frame_ptr Frame handle to destroy
void evm_frame_destroy(evm_frame_t frame_ptr);

/// Reset frame to initial state with new gas amount
/// @param frame_ptr Frame handle
/// @param new_gas New gas amount
/// @return Error code
int evm_frame_reset(evm_frame_t frame_ptr, uint64_t new_gas);

// ============================================================================
// EXECUTION
// ============================================================================

/// Execute frame until completion or error
/// @param frame_ptr Frame handle
/// @return Error code (EVM_SUCCESS or EVM_ERROR_STOP for normal completion)
int evm_frame_execute(evm_frame_t frame_ptr);

// ============================================================================
// STACK OPERATIONS
// ============================================================================

/// Push a 64-bit value onto the stack (zero-extended to 256 bits)
/// @param frame_ptr Frame handle
/// @param value Value to push
/// @return Error code
int evm_frame_push_u64(evm_frame_t frame_ptr, uint64_t value);

/// Push a 32-bit value onto the stack (zero-extended to 256 bits)
/// @param frame_ptr Frame handle
/// @param value Value to push
/// @return Error code
int evm_frame_push_u32(evm_frame_t frame_ptr, uint32_t value);

/// Push 256-bit value from byte array (big-endian, max 32 bytes)
/// @param frame_ptr Frame handle
/// @param bytes Pointer to byte array
/// @param len Length of byte array (max 32)
/// @return Error code
int evm_frame_push_bytes(evm_frame_t frame_ptr, const uint8_t* bytes, size_t len);

/// Pop value from stack and return as 64-bit (truncated if larger)
/// @param frame_ptr Frame handle
/// @param value_out Pointer to store popped value
/// @return Error code
int evm_frame_pop_u64(evm_frame_t frame_ptr, uint64_t* value_out);

/// Pop value from stack and return as 32-bit (truncated if larger)
/// @param frame_ptr Frame handle
/// @param value_out Pointer to store popped value
/// @return Error code
int evm_frame_pop_u32(evm_frame_t frame_ptr, uint32_t* value_out);

/// Pop value from stack and return as byte array (big-endian, 32 bytes)
/// @param frame_ptr Frame handle
/// @param bytes_out Pointer to 32-byte buffer for result
/// @return Error code
int evm_frame_pop_bytes(evm_frame_t frame_ptr, uint8_t* bytes_out);

/// Peek at top of stack without removing (return as 64-bit)
/// @param frame_ptr Frame handle
/// @param value_out Pointer to store peeked value
/// @return Error code
int evm_frame_peek_u64(evm_frame_t frame_ptr, uint64_t* value_out);

/// Get current stack depth
/// @param frame_ptr Frame handle
/// @return Current number of items on stack
uint32_t evm_frame_stack_size(evm_frame_t frame_ptr);

/// Get maximum stack capacity
/// @param frame_ptr Frame handle
/// @return Maximum stack capacity
uint32_t evm_frame_stack_capacity(evm_frame_t frame_ptr);

// ============================================================================
// STATE INSPECTION
// ============================================================================

/// Get remaining gas
/// @param frame_ptr Frame handle
/// @return Remaining gas amount
uint64_t evm_frame_get_gas_remaining(evm_frame_t frame_ptr);

/// Get gas used so far
/// @param frame_ptr Frame handle
/// @return Gas used amount
uint64_t evm_frame_get_gas_used(evm_frame_t frame_ptr);

/// Get current program counter
/// @param frame_ptr Frame handle
/// @return Current PC value
uint32_t evm_frame_get_pc(evm_frame_t frame_ptr);

/// Get bytecode length
/// @param frame_ptr Frame handle
/// @return Bytecode length in bytes
size_t evm_frame_get_bytecode_len(evm_frame_t frame_ptr);

/// Get current opcode at PC (returns 0xFF if out of bounds)
/// @param frame_ptr Frame handle
/// @return Current opcode byte
uint8_t evm_frame_get_current_opcode(evm_frame_t frame_ptr);

/// Check if execution has stopped
/// @param frame_ptr Frame handle
/// @return true if stopped, false if still running
bool evm_frame_is_stopped(evm_frame_t frame_ptr);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/// Convert error code to human-readable string
/// @param error_code Error code to convert
/// @return Pointer to error string (statically allocated)
const char* evm_error_string(int error_code);

/// Check if error represents a normal stop condition
/// @param error_code Error code to check
/// @return true if normal stop, false otherwise
bool evm_error_is_stop(int error_code);

// ============================================================================
// DEBUGGING AND TRACING FUNCTIONS
// ============================================================================

/// Create a debugging frame with tracing capabilities
/// @param bytecode Pointer to bytecode array
/// @param bytecode_len Length of bytecode in bytes
/// @param initial_gas Initial gas amount
/// @return Opaque frame handle, or NULL on failure
evm_frame_t evm_debug_frame_create(
    const uint8_t* bytecode,
    size_t bytecode_len,
    uint64_t initial_gas
);

/// Set step mode for debugging frame
/// @param frame_ptr Debug frame handle
/// @param enabled true to enable step mode, false to disable
/// @return Error code
int evm_debug_set_step_mode(evm_frame_t frame_ptr, bool enabled);

/// Check if frame is currently paused
/// @param frame_ptr Debug frame handle
/// @return true if paused, false otherwise
bool evm_debug_is_paused(evm_frame_t frame_ptr);

/// Resume execution from paused state
/// @param frame_ptr Debug frame handle
/// @return Error code
int evm_debug_resume(evm_frame_t frame_ptr);

/// Execute a single step and pause
/// @param frame_ptr Debug frame handle
/// @return Error code
int evm_debug_step(evm_frame_t frame_ptr);

/// Add a breakpoint at the given PC
/// @param frame_ptr Debug frame handle
/// @param pc Program counter value to break on
/// @return Error code
int evm_debug_add_breakpoint(evm_frame_t frame_ptr, uint32_t pc);

/// Remove a breakpoint at the given PC
/// @param frame_ptr Debug frame handle
/// @param pc Program counter value
/// @return 1 if breakpoint was removed, 0 if not found
int evm_debug_remove_breakpoint(evm_frame_t frame_ptr, uint32_t pc);

/// Check if there's a breakpoint at the given PC
/// @param frame_ptr Debug frame handle
/// @param pc Program counter value
/// @return 1 if breakpoint exists, 0 otherwise
int evm_debug_has_breakpoint(evm_frame_t frame_ptr, uint32_t pc);

/// Clear all breakpoints
/// @param frame_ptr Debug frame handle
/// @return Error code
int evm_debug_clear_breakpoints(evm_frame_t frame_ptr);

/// Get the number of execution steps taken
/// @param frame_ptr Debug frame handle
/// @return Number of steps
uint64_t evm_debug_get_step_count(evm_frame_t frame_ptr);

/// Get execution step information by index
/// @param frame_ptr Debug frame handle
/// @param step_index Step index (0-based)
/// @param step_out Pointer to structure to fill with step info
/// @return Error code
int evm_debug_get_step(evm_frame_t frame_ptr, uint64_t step_index, void* step_out);

/// Get current stack contents
/// @param frame_ptr Frame handle
/// @param stack_out Buffer to write stack items (32 bytes each)
/// @param max_items Maximum number of items to write
/// @param count_out Pointer to store actual number of items written
/// @return Error code
int evm_frame_get_stack(evm_frame_t frame_ptr, uint8_t* stack_out, uint32_t max_items, uint32_t* count_out);

/// Get stack item at specific index (0 = bottom, top = depth-1)
/// @param frame_ptr Frame handle
/// @param index Stack index
/// @param item_out Buffer for 32-byte stack item
/// @return Error code
int evm_frame_get_stack_item(evm_frame_t frame_ptr, uint32_t index, uint8_t* item_out);

/// Get memory contents
/// @param frame_ptr Frame handle
/// @param offset Memory offset to start reading
/// @param length Number of bytes to read
/// @param data_out Buffer to write memory data
/// @return Error code
int evm_frame_get_memory(evm_frame_t frame_ptr, uint32_t offset, uint32_t length, uint8_t* data_out);

/// Get current memory size
/// @param frame_ptr Frame handle
/// @return Memory size in bytes
uint32_t evm_frame_get_memory_size(evm_frame_t frame_ptr);

/// Get debugging statistics
/// @param frame_ptr Debug frame handle
/// @param stats_out Pointer to structure to fill with stats
/// @return Error code
int evm_debug_get_stats(evm_frame_t frame_ptr, void* stats_out);

// ============================================================================
// DEBUG FUNCTIONS (DEBUG BUILDS ONLY)
// ============================================================================

#ifndef NDEBUG
/// Simple test function - executes PUSH1 5, PUSH1 10, ADD, STOP
/// @return Error code (EVM_SUCCESS on success)
int evm2_test_simple_execution(void);

/// Test stack operations
/// @return Error code (EVM_SUCCESS on success)
int evm2_test_stack_operations(void);
#endif

#ifdef __cplusplus
}
#endif

#endif // EVM2_C_H