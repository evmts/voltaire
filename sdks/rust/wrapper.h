#ifndef GUILLOTINE_WRAPPER_H
#define GUILLOTINE_WRAPPER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Opaque pointer types
typedef struct EvmHandle EvmHandle;

// Block info for FFI
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

// Call parameters for FFI
typedef struct {
    uint8_t caller[20];
    uint8_t to[20];
    uint8_t value[32]; // u256 as bytes
    const uint8_t* input;
    size_t input_len;
    uint64_t gas;
    uint8_t call_type; // 0=CALL, 1=CALLCODE, 2=DELEGATECALL, 3=STATICCALL, 4=CREATE, 5=CREATE2
    uint8_t salt[32]; // For CREATE2
} CallParams;

// Log entry for FFI
typedef struct {
    uint8_t address[20];
    const uint8_t (*topics)[32];  // Array of 32-byte topics
    size_t topics_len;
    const uint8_t* data;
    size_t data_len;
} LogEntry;

// Self-destruct record for FFI
typedef struct {
    uint8_t contract[20];
    uint8_t beneficiary[20];
} SelfDestructRecord;

// Storage access record for FFI
typedef struct {
    uint8_t address[20];
    uint8_t slot[32];  // u256 as bytes
} StorageAccessRecord;

// Result structure for FFI
typedef struct {
    bool success;
    uint64_t gas_left;
    const uint8_t* output;
    size_t output_len;
    const char* error_message;
    // Additional fields from CallResult
    const LogEntry* logs;
    size_t logs_len;
    const SelfDestructRecord* selfdestructs;
    size_t selfdestructs_len;
    const uint8_t (*accessed_addresses)[20];  // Array of addresses
    size_t accessed_addresses_len;
    const StorageAccessRecord* accessed_storage;
    size_t accessed_storage_len;
    uint8_t created_address[20];  // For CREATE/CREATE2, zero if not applicable
    bool has_created_address;
    // JSON-RPC trace (if available)
    const uint8_t* trace_json;
    size_t trace_json_len;
} EvmResult;

// Initialize the FFI layer
void guillotine_init(void);
void guillotine_cleanup(void);

// EVM creation and destruction
EvmHandle* guillotine_evm_create(const BlockInfoFFI* block_info);
EvmHandle* guillotine_evm_create_tracing(const BlockInfoFFI* block_info);
void guillotine_evm_destroy(EvmHandle* handle);
void guillotine_evm_destroy_tracing(EvmHandle* handle);

// State management
bool guillotine_set_balance(EvmHandle* handle, const uint8_t address[20], const uint8_t balance[32]);
bool guillotine_set_balance_tracing(EvmHandle* handle, const uint8_t address[20], const uint8_t balance[32]);
bool guillotine_get_balance(EvmHandle* handle, const uint8_t address[20], uint8_t balance_out[32]);
bool guillotine_set_code(EvmHandle* handle, const uint8_t address[20], const uint8_t* code, size_t code_len);
bool guillotine_set_code_tracing(EvmHandle* handle, const uint8_t address[20], const uint8_t* code, size_t code_len);
bool guillotine_get_code(EvmHandle* handle, const uint8_t address[20], uint8_t** code_out, size_t* len_out);
bool guillotine_set_storage(EvmHandle* handle, const uint8_t address[20], const uint8_t key[32], const uint8_t value[32]);
bool guillotine_get_storage(EvmHandle* handle, const uint8_t address[20], const uint8_t key[32], uint8_t value_out[32]);

// Execution
EvmResult* guillotine_call(EvmHandle* handle, const CallParams* params);
EvmResult* guillotine_call_tracing(EvmHandle* handle, const CallParams* params);
EvmResult* guillotine_simulate(EvmHandle* handle, const CallParams* params);

// Memory cleanup
void guillotine_free_result(EvmResult* result);
void guillotine_free_code(uint8_t* code, size_t len);
void guillotine_free_output(uint8_t* output, size_t len);

// Error handling
const char* guillotine_get_last_error(void);

#ifdef __cplusplus
}
#endif

#endif // GUILLOTINE_WRAPPER_H