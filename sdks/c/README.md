# Guillotine EVM C SDK

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We’re looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

C bindings for the Guillotine Ethereum Virtual Machine implementation in Zig.

## Overview

Guillotine provides C bindings through `src/root_c.zig`, allowing you to integrate the EVM into C/C++ applications or any language with FFI support.

## Building from Source

### Prerequisites

- Zig compiler (0.14.1 or later)
- Git (for submodules)
- C compiler (for linking)

### Build Steps

1. **Clone and initialize submodules:**
```bash
git clone https://github.com/your-org/guillotine.git
cd guillotine
git submodule update --init --recursive
```

2. **Build the C library:**

For a **shared library** (.so/.dylib/.dll):
```bash
zig build-lib -dynamic src/root_c.zig -femit-bin=libguillotine.so
```

For a **static library** (.a/.lib):
```bash
zig build-lib src/root_c.zig -femit-bin=libguillotine.a
```

Using the build system:
```bash
zig build
# The library will be in zig-out/lib/
```

## API Overview

### Core Modules

The C API exposes functionality from several modules:

- **Frame API** (`frame_c.zig`) - EVM execution frame management
- **Stack API** (`stack_c.zig`) - Stack operations
- **Memory API** (`memory_c.zig`) - Memory management
- **Bytecode API** (`bytecode_c.zig`) - Bytecode handling and analysis
- **Precompiles API** (`precompiles_c.zig`) - Precompiled contracts
- **Hardfork API** (`hardfork_c.zig`) - Fork configuration

### Basic Usage

```c
#include <guillotine.h>

// Initialize the library
if (evm_init() != 0) {
    fprintf(stderr, "Failed to initialize EVM\n");
    return -1;
}

// Create an EVM frame
uint8_t bytecode[] = {
    0x60, 0x05,  // PUSH1 5
    0x60, 0x0A,  // PUSH1 10
    0x01,        // ADD
    0x00         // STOP
};

void* frame = evm_frame_create(bytecode, sizeof(bytecode), 1000000);
if (!frame) {
    fprintf(stderr, "Failed to create frame\n");
    return -1;
}

// Execute the bytecode
int result = evm_frame_execute(frame);
if (result == 0) {
    printf("Execution successful\n");
}

// Clean up
evm_frame_destroy(frame);
evm_cleanup();
```

### Memory Management

All created objects must be destroyed:
- `evm_frame_create()` → `evm_frame_destroy()`
- `evm_stack_create()` → `evm_stack_destroy()`
- `evm_memory_create()` → `evm_memory_destroy()`
- `evm_bytecode_create()` → `evm_bytecode_destroy()`

### Error Codes

```c
#define EVM_SUCCESS           0
#define EVM_ERROR_OOM        -1  // Out of memory
#define EVM_ERROR_INVALID    -2  // Invalid parameter
#define EVM_ERROR_OVERFLOW   -3  // Stack overflow
#define EVM_ERROR_UNDERFLOW  -4  // Stack underflow
#define EVM_ERROR_GAS        -5  // Out of gas
#define EVM_ERROR_REVERT     -6  // Execution reverted
```

## Configuration

The EVM can be configured through `src/evm_config.zig`:

```zig
const EvmConfig = struct {
    // Hardfork settings
    eips: Eips = Eips{ .hardfork = Hardfork.CANCUN },
    
    // Execution limits
    max_call_depth: u11 = 1024,
    max_input_size: u18 = 131072,  // 128 KB
    
    // Feature flags
    enable_precompiles: bool = true,
    enable_fusion: bool = true,
    
    // Stack and memory
    stack_size: u12 = 1024,
    memory_limit: u64 = 0xFFFFFF,
};
```

To build with custom configuration, modify `evm_config.zig` before building.

## Advanced Features

### Stack Operations

```c
void* stack = evm_stack_create();

// Push values
evm_stack_push_u64(stack, 42);
evm_stack_push_u64(stack, 100);

// Pop values
uint64_t value;
evm_stack_pop_u64(stack, &value);

// Get stack size
size_t size = evm_stack_size(stack);

evm_stack_destroy(stack);
```

### Memory Operations

```c
void* memory = evm_memory_create(0);

// Write 32-byte word
uint8_t data[32] = {0};
data[31] = 0x42;
evm_memory_write_u256(memory, 0, data);

// Read 32-byte word
uint8_t result[32];
evm_memory_read_u256(memory, 0, result);

evm_memory_destroy(memory);
```

### Bytecode Analysis

```c
void* bytecode = evm_bytecode_create(code, code_len);

// Get bytecode statistics
CBytecodeStats stats;
evm_bytecode_get_stats(bytecode, &stats);

printf("Bytecode size: %zu\n", stats.size);
printf("Number of jumpdests: %u\n", stats.num_jumpdests);

evm_bytecode_destroy(bytecode);
```

## Testing

The library includes test functions for verification:

```c
// Test simple execution
if (evm_test_simple_execution() == 0) {
    printf("Simple execution test passed\n");
}

// Test stack operations
if (evm_test_stack_operations() == 0) {
    printf("Stack operations test passed\n");
}

// Test integration
if (evm_test_integration() == 0) {
    printf("Integration test passed\n");
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
