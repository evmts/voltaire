# Guillotine EVM C SDK

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We're looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

📚 **[View Full Documentation](https://guillotine.dev/sdks/c)**

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

C bindings for the Guillotine Ethereum Virtual Machine implementation in Zig.

## Overview

Guillotine provides C bindings through `src/evm_c_api.zig`, allowing you to integrate the EVM into C/C++ applications or any language with FFI support. The API includes both regular execution and tracing-enabled execution for debugging and JSON-RPC compatibility.

## Building from Source

### Prerequisites

- Zig compiler (0.14.1 or later)
- Git (for submodules)
- C compiler (for linking)

### Build Steps

1. **Clone and initialize submodules:**
```bash
git clone https://github.com/evmts/Guillotine.git
cd guillotine
git submodule update --init --recursive
```

2. **Build the C library:**

For a **shared library** (.so/.dylib/.dll):
```bash
zig build shared
```

For a **static library** (.a/.lib):
```bash
zig build static
```

The libraries will be built to `zig-out/lib/`:
- `libguillotine_ffi.so` (shared)
- `libguillotine_ffi.a` (static)

## API Overview

### Core Functions

The C API provides a complete EVM implementation with these main categories:

- **Instance Management** - Create, configure, and destroy EVM instances
- **State Management** - Set account balances, code, and storage
- **Execution** - Execute calls, simulate transactions, and debug with tracing
- **Memory Management** - Proper cleanup of allocated resources

### Basic Usage

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

// Include Guillotine EVM headers (you'll need to create these from the API)

int main() {
    // Initialize the library
    guillotine_init();
    
    // Create block info
    BlockInfoFFI block_info = {
        .number = 1000000,
        .timestamp = 1640995200, // Jan 1, 2022
        .gas_limit = 30000000,
        .coinbase = {0}, // Zero address
        .base_fee = 20000000000, // 20 gwei
        .chain_id = 1, // Ethereum mainnet
        .difficulty = 0,
        .prev_randao = {0}
    };
    
    // Create EVM instance
    EvmHandle* evm = guillotine_evm_create(&block_info);
    if (!evm) {
        fprintf(stderr, "Failed to create EVM: %s\n", guillotine_get_last_error());
        return 1;
    }
    
    // Set up account with code
    uint8_t contract_address[20] = {0x11, 0x11, 0x11, /* ... */};
    uint8_t bytecode[] = {
        0x60, 0x05,  // PUSH1 5
        0x60, 0x0A,  // PUSH1 10
        0x01,        // ADD
        0x50,        // POP
        0x00         // STOP
    };
    
    if (!guillotine_set_code(evm, &contract_address, bytecode, sizeof(bytecode))) {
        fprintf(stderr, "Failed to set code: %s\n", guillotine_get_last_error());
        guillotine_evm_destroy(evm);
        return 1;
    }
    
    // Create call parameters
    CallParams params = {
        .caller = {0x22, 0x22, 0x22, /* ... */},
        .to = {0x11, 0x11, 0x11, /* ... */}, // Contract address
        .value = {0}, // No value
        .input = NULL,
        .input_len = 0,
        .gas = 1000000,
        .call_type = 0, // CALL
        .salt = {0}
    };
    
    // Execute the call
    EvmResult* result = guillotine_call(evm, &params);
    if (!result) {
        fprintf(stderr, "Failed to execute call: %s\n", guillotine_get_last_error());
        guillotine_evm_destroy(evm);
        return 1;
    }
    
    printf("Execution %s\n", result->success ? "succeeded" : "failed");
    printf("Gas used: %lu\n", 1000000 - result->gas_left);
    
    // Clean up
    guillotine_free_result(result);
    guillotine_evm_destroy(evm);
    guillotine_cleanup();
    
    return 0;
}
```

### Memory Management

**Critical**: Always match create/destroy functions and free allocated resources:

- `guillotine_init()` → `guillotine_cleanup()`
- `guillotine_evm_create()` → `guillotine_evm_destroy()`  
- `guillotine_evm_create_tracing()` → `guillotine_evm_destroy_tracing()`
- `guillotine_call()` returns `EvmResult*` → `guillotine_free_result()`
- `guillotine_get_code()` returns code buffer → `guillotine_free_code()`

### Error Handling

The API uses boolean return values and string error messages:

```c
// Check boolean returns
if (!guillotine_set_balance(evm, &address, &balance)) {
    const char* error = guillotine_get_last_error();
    fprintf(stderr, "Error: %s\n", error);
}

// Check NULL returns  
EvmResult* result = guillotine_call(evm, &params);
if (!result) {
    const char* error = guillotine_get_last_error();
    fprintf(stderr, "Call failed: %s\n", error);
    return;
}
```

## API Reference

### Data Structures

```c
// EVM instance handle (opaque)
typedef struct EvmHandle EvmHandle;

// Block information
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

// Call parameters
typedef struct {
    uint8_t caller[20];
    uint8_t to[20];
    uint8_t value[32];        // u256 as big-endian bytes
    const uint8_t* input;
    size_t input_len;
    uint64_t gas;
    uint8_t call_type;        // 0=CALL, 1=CALLCODE, 2=DELEGATECALL, 3=STATICCALL, 4=CREATE, 5=CREATE2
    uint8_t salt[32];         // For CREATE2
} CallParams;

// Execution result
typedef struct {
    bool success;
    uint64_t gas_left;
    const uint8_t* output;
    size_t output_len;
    const char* error_message;
    // Additional fields for logs, selfdestructs, etc.
    // See src/evm_c_api.zig for complete structure
} EvmResult;
```

## Advanced Features

### Core Functions

```c
// Library initialization
void guillotine_init(void);
void guillotine_cleanup(void);

// EVM instance management
EvmHandle* guillotine_evm_create(const BlockInfoFFI* block_info);
EvmHandle* guillotine_evm_create_tracing(const BlockInfoFFI* block_info);
void guillotine_evm_destroy(EvmHandle* handle);

// State management
bool guillotine_set_balance(EvmHandle* handle, const uint8_t address[20], const uint8_t balance[32]);
bool guillotine_set_code(EvmHandle* handle, const uint8_t address[20], const uint8_t* code, size_t code_len);
bool guillotine_set_storage(EvmHandle* handle, const uint8_t address[20], const uint8_t key[32], const uint8_t value[32]);

// State inspection
bool guillotine_get_balance(EvmHandle* handle, const uint8_t address[20], uint8_t balance_out[32]);
bool guillotine_get_code(EvmHandle* handle, const uint8_t address[20], uint8_t** code_out, size_t* len_out);
bool guillotine_get_storage(EvmHandle* handle, const uint8_t address[20], const uint8_t key[32], uint8_t value_out[32]);

// Execution
EvmResult* guillotine_call(EvmHandle* handle, const CallParams* params);
EvmResult* guillotine_call_tracing(EvmHandle* handle, const CallParams* params);
EvmResult* guillotine_simulate(EvmHandle* handle, const CallParams* params);

// Memory management
void guillotine_free_result(EvmResult* result);
void guillotine_free_code(uint8_t* code, size_t len);

// Error handling
const char* guillotine_get_last_error(void);
```

### Tracing and Debugging

```c
// Create EVM with tracing enabled
EvmHandle* tracing_evm = guillotine_evm_create_tracing(&block_info);

// Execute with trace capture
EvmResult* result = guillotine_call_tracing(tracing_evm, &params);

// Check if trace JSON is available
if (result->trace_json_len > 0) {
    printf("JSON-RPC trace: %.*s\n", (int)result->trace_json_len, result->trace_json);
}

guillotine_free_result(result);
guillotine_evm_destroy_tracing(tracing_evm);
```

### Working with Logs and Events

```c
EvmResult* result = guillotine_call(evm, &params);

// Process logs
for (size_t i = 0; i < result->logs_len; i++) {
    LogEntry* log = &result->logs[i];
    
    printf("Log from address: ");
    for (int j = 0; j < 20; j++) {
        printf("%02x", log->address[j]);
    }
    printf("\n");
    
    // Process topics
    for (size_t t = 0; t < log->topics_len; t++) {
        printf("Topic %zu: ", t);
        for (int j = 0; j < 32; j++) {
            printf("%02x", log->topics[t][j]);
        }
        printf("\n");
    }
    
    // Process data
    printf("Data (%zu bytes): ", log->data_len);
    for (size_t d = 0; d < log->data_len; d++) {
        printf("%02x", log->data[d]);
    }
    printf("\n");
}

guillotine_free_result(result);
```

## Testing

### Running Tests

Build and run the project tests to verify the C API:

```bash
# Build project
zig build

# Run core tests
zig build test

# Run opcode tests
zig build test-opcodes

# Build C libraries
zig build shared
zig build static
```

### Example Integration Test

```c
#include <stdio.h>
#include <string.h>
#include <assert.h>

void test_basic_call() {
    guillotine_init();
    
    BlockInfoFFI block_info = {
        .number = 1000000,
        .timestamp = 1640995200,
        .gas_limit = 30000000,
        .chain_id = 1,
        .base_fee = 20000000000,
        // ... other fields
    };
    
    EvmHandle* evm = guillotine_evm_create(&block_info);
    assert(evm != NULL);
    
    // Simple bytecode that pushes values and adds them
    uint8_t bytecode[] = {
        0x60, 0x05,  // PUSH1 5  
        0x60, 0x0A,  // PUSH1 10
        0x01,        // ADD (result: 15)
        0x60, 0x00,  // PUSH1 0 (memory offset)
        0x52,        // MSTORE (store result to memory)
        0x60, 0x20,  // PUSH1 32 (return size)
        0x60, 0x00,  // PUSH1 0 (return offset)
        0xF3         // RETURN
    };
    
    uint8_t contract_addr[20] = {0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
                                 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11};
    
    assert(guillotine_set_code(evm, &contract_addr, bytecode, sizeof(bytecode)));
    
    CallParams params = {
        .call_type = 0, // CALL
        .gas = 1000000,
        .input = NULL,
        .input_len = 0
    };
    memcpy(params.caller, contract_addr, 20);
    memcpy(params.to, contract_addr, 20);
    
    EvmResult* result = guillotine_call(evm, &params);
    assert(result != NULL);
    assert(result->success);
    
    // Should have 32-byte return value with result 15
    assert(result->output_len == 32);
    assert(result->output[31] == 15); // Value at least significant byte
    
    printf("Test passed: Gas used = %lu\n", 1000000 - result->gas_left);
    
    guillotine_free_result(result);
    guillotine_evm_destroy(evm);
    guillotine_cleanup();
}

int main() {
    test_basic_call();
    printf("All tests passed!\n");
    return 0;
}
```

## Language Bindings

The C API can be used from various languages:

- **Python**: Use `ctypes` or `cffi`
- **JavaScript/Node.js**: Use `ffi-napi`
- **Go**: Use `cgo`
- **Rust**: Use `bindgen` and FFI
- **Ruby**: Use `ffi` gem
- **Java**: Use JNI

## Example Projects

See the `examples/` directory for complete examples:
- `examples/c/` - Pure C example
- `examples/python/` - Python FFI example
- `examples/node/` - Node.js integration

## Performance Considerations

- The library is optimized for minimal allocations
- Bytecode fusion is enabled by default for better performance
- Use batch operations when possible to reduce FFI overhead
- Consider using the static library for better performance

## Troubleshooting

### Undefined symbols
Ensure you're linking against the correct libraries:
```bash
gcc your_program.c -L. -lguillotine -lc
```

### Segmentation faults
- Always check return values for NULL
- Ensure proper initialization with `evm_init()`
- Match create/destroy calls

### Memory leaks
- Use valgrind or similar tools to verify proper cleanup
- Ensure all created objects are destroyed

## License

See the main project LICENSE file.

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/guillotine/issues
- Documentation: https://docs.guillotine.dev
