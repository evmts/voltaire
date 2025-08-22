# EVM2 C API Examples

This directory contains examples demonstrating how to use the EVM2 C API from different programming languages.

## Prerequisites

Before running any examples, you must first build the EVM2 C API libraries:

```bash
cd ../../..  # Go to Guillotine root
zig build evm2-c
```

This creates both static (`libevm2_c.a`) and shared (`libevm2_c.dylib`/`.so`) libraries in the Zig cache directory.

## Examples

### C Example (`c_example.c`)

A comprehensive C example demonstrating all major API features.

**Requirements:**
- GCC or Clang compiler
- The EVM2 C static library

**Build and run:**
```bash
make          # Build the example
make run      # Build and run the example
make clean    # Clean build artifacts
```

**Features demonstrated:**
- Library initialization and metadata
- Frame creation and execution
- Manual stack operations
- Bytecode inspection
- Built-in test functions

### Python Example (`python_example.py`)

A Python wrapper using ctypes to interface with the C API.

**Requirements:**
- Python 3.6+
- The EVM2 C shared library (`.dylib` or `.so`)

**Run:**
```bash
python3 python_example.py
```

**Features:**
- Automatic library discovery and loading
- Object-oriented Python wrapper class
- Error handling with exceptions
- All major API operations

### JavaScript Example (`js_example.js`)

A Node.js example using FFI to call the C API.

**Requirements:**
- Node.js 14+
- ffi-napi and ref-napi packages
- The EVM2 C shared library

**Setup and run:**
```bash
npm install ffi-napi ref-napi    # Install dependencies
node js_example.js               # Run the example
```

**Features:**
- Automatic library discovery
- JavaScript class wrapper
- Async-friendly design
- Complete API coverage

## API Overview

The EVM2 C API provides the following main categories of functions:

### Library Management
- `evm2_version()` - Get version string
- `evm2_build_info()` - Get build information
- `evm2_init()` - Initialize library
- `evm2_cleanup()` - Cleanup resources

### Frame Lifecycle
- `evm_frame_create()` - Create new frame with bytecode
- `evm_frame_destroy()` - Free frame memory
- `evm_frame_reset()` - Reset frame to initial state

### Execution
- `evm_frame_execute()` - Execute until completion or error

### Stack Operations
- `evm_frame_push_u64()` - Push 64-bit value
- `evm_frame_push_u32()` - Push 32-bit value
- `evm_frame_push_bytes()` - Push from byte array
- `evm_frame_pop_u64()` - Pop to 64-bit value
- `evm_frame_pop_u32()` - Pop to 32-bit value
- `evm_frame_pop_bytes()` - Pop to byte array
- `evm_frame_peek_u64()` - Peek at top value
- `evm_frame_stack_size()` - Get current stack depth
- `evm_frame_stack_capacity()` - Get maximum stack size

### State Inspection
- `evm_frame_get_gas_remaining()` - Get remaining gas
- `evm_frame_get_gas_used()` - Get gas consumed
- `evm_frame_get_pc()` - Get program counter
- `evm_frame_get_bytecode_len()` - Get bytecode length
- `evm_frame_get_current_opcode()` - Get current opcode
- `evm_frame_is_stopped()` - Check if execution stopped

### Error Handling
- `evm_error_string()` - Convert error code to string
- `evm_error_is_stop()` - Check if error is normal stop

## Error Codes

The API uses integer error codes:

```c
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
```

## Memory Management

The C API handles all memory management internally:

- **Frame Creation**: API copies and owns the bytecode
- **Stack Memory**: Automatically allocated and freed
- **Error Safety**: No dangling pointers or memory leaks
- **Thread Safety**: Each frame is independent

## Language Binding Guidelines

When creating bindings for other languages:

1. **Use opaque pointers** for frame handles
2. **Copy bytecode** to avoid lifetime issues
3. **Handle errors** by checking return codes
4. **Wrap in classes** for object-oriented languages
5. **Use shared libraries** when possible (easier than static)
6. **Check for null** returns from `evm_frame_create()`

## Building for Other Platforms

The build system supports multiple targets:

```bash
# Cross-compile for Linux
zig build evm2-c -Dtarget=x86_64-linux

# Cross-compile for Windows
zig build evm2-c -Dtarget=x86_64-windows

# Build optimized release
zig build evm2-c -Doptimize=ReleaseFast
```

## Troubleshooting

### Library Not Found
- Ensure `zig build evm2-c` completed successfully
- Check that library files exist in `.zig-cache/o/*/libevm2_c.*`
- Verify you're running from the correct directory

### Compilation Errors
- Make sure you have the correct compiler installed
- Check that the header file path is correct
- Verify library architecture matches your system

### Runtime Errors
- Check return codes from all API functions
- Use `evm_error_string()` to get readable error messages
- Ensure bytecode is valid EVM bytecode

### FFI Issues (Python/JavaScript)
- Install required FFI packages
- Use shared libraries (.dylib/.so) instead of static (.a)
- Check that library architecture matches your runtime

## Contributing

When adding new language examples:

1. Follow the same structure as existing examples
2. Demonstrate all major API features
3. Include proper error handling
4. Add setup instructions to this README
5. Test on multiple platforms if possible