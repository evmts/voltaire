#ifndef GUILLOTINE_H
#define GUILLOTINE_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

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

// C-compatible execution result (from root.zig)
typedef struct {
    int success;
    unsigned long long gas_used;
    const uint8_t* return_data_ptr;
    size_t return_data_len;
    int error_code;
} CExecutionResult;

// Opaque VM pointer
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
    const char* error_message;
} GuillotineExecutionResult;

// Core EVM functions
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

// VM management functions
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

#ifdef __cplusplus
}
#endif

#endif // GUILLOTINE_H