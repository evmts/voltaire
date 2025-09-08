#ifndef GUILLOTINE_FFI_H
#define GUILLOTINE_FFI_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Opaque handle to EVM instance
typedef void* EvmHandle;

// Block information structure
typedef struct {
    uint64_t number;
    uint64_t timestamp;
    uint64_t gas_limit;
    uint8_t coinbase[20];
    uint64_t base_fee;
    uint64_t chain_id;
    uint64_t difficulty;
    uint8_t prev_randao[32];
} BlockInfoFFI;

// Call parameters structure
typedef struct {
    uint8_t caller[20];
    uint8_t to[20];
    uint8_t value[32];
    const uint8_t* input;
    size_t input_len;
    uint64_t gas;
    uint8_t call_type; // 0=CALL, 1=DELEGATECALL, 2=STATICCALL, 3=CREATE, 4=CREATE2
    uint8_t salt[32];   // For CREATE2
} CallParams;

// Result structure
typedef struct {
    bool success;
    uint64_t gas_left;
    const uint8_t* output;
    size_t output_len;
    const char* error_message;
} EvmResult;

// Initialize the FFI library
void guillotine_init(void);

// Clean up the FFI library
void guillotine_cleanup(void);

// Create a new EVM instance
EvmHandle guillotine_evm_create(const BlockInfoFFI* block_info);

// Destroy an EVM instance
void guillotine_evm_destroy(EvmHandle handle);

// Set account balance
bool guillotine_set_balance(EvmHandle handle, const uint8_t address[20], const uint8_t balance[32]);

// Set contract code
bool guillotine_set_code(EvmHandle handle, const uint8_t address[20], const uint8_t* code, size_t code_len);

// Execute a call
EvmResult* guillotine_call(EvmHandle handle, const CallParams* params);

// Simulate a call (doesn't commit state)
EvmResult* guillotine_simulate(EvmHandle handle, const CallParams* params);

// Free result structure
void guillotine_free_result(EvmResult* result);

// Free output buffer
void guillotine_free_output(uint8_t* output, size_t len);

// Get last error message
const char* guillotine_get_last_error(void);

#ifdef __cplusplus
}
#endif

#endif // GUILLOTINE_FFI_H