#ifndef GUILLOTINE_WRAPPER_H
#define GUILLOTINE_WRAPPER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

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
GuillotineVm* guillotine_vm_create();
void guillotine_vm_destroy(GuillotineVm* vm);

// State management
bool guillotine_set_balance(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* balance);
bool guillotine_get_balance(GuillotineVm* vm, const GuillotineAddress* address, GuillotineU256* balance);
bool guillotine_set_code(GuillotineVm* vm, const GuillotineAddress* address, const uint8_t* code, size_t code_len);
bool guillotine_set_storage(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* key, const GuillotineU256* value);
bool guillotine_get_storage(GuillotineVm* vm, const GuillotineAddress* address, const GuillotineU256* key, GuillotineU256* value);

// Execution
GuillotineExecutionResult guillotine_vm_execute(
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

#ifdef __cplusplus
}
#endif

#endif // GUILLOTINE_WRAPPER_H