# voltaire-c

C bindings for Voltaire Ethereum primitives and cryptography.

Voltaire exports a C FFI API directly from Zig. No wrapper code needed—just link against the compiled library.

## Building

```bash
# Build native library (generates libprimitives.a / libprimitives.dylib / libprimitives.so)
zig build build-ts-native

# Build WASM (generates primitives.wasm)
zig build build-ts-wasm
```

## Linking

```bash
# macOS/Linux
gcc your_program.c -L./zig-out/lib -lprimitives -o your_program

# With pkg-config (if available)
gcc your_program.c $(pkg-config --libs voltaire) -o your_program
```

## Documentation

See `docs/` for comprehensive API documentation.

## Quick Example

```c
#include <stdio.h>
#include <string.h>

// Voltaire C API types
typedef struct { unsigned char bytes[20]; } PrimitivesAddress;
typedef struct { unsigned char bytes[32]; } PrimitivesHash;

// Voltaire C API functions
extern int primitives_address_from_hex(const char* hex, PrimitivesAddress* out);
extern int primitives_keccak256(const unsigned char* data, size_t len, PrimitivesHash* out);

int main() {
    // Parse address
    PrimitivesAddress addr;
    int result = primitives_address_from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", &addr);
    if (result != 0) {
        printf("Failed to parse address\n");
        return 1;
    }

    // Hash data
    PrimitivesHash hash;
    const char* data = "hello world";
    primitives_keccak256((unsigned char*)data, strlen(data), &hash);

    printf("Hash computed successfully\n");
    return 0;
}
```

## Error Codes

All functions return `PRIMITIVES_SUCCESS` (0) on success, or a negative error code:

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Operation completed successfully |
| -1 | INVALID_HEX | Invalid hexadecimal string |
| -2 | INVALID_LENGTH | Invalid data length |
| -3 | INVALID_CHECKSUM | EIP-55 checksum validation failed |
| -4 | OUT_OF_MEMORY | Memory allocation failed |
| -5 | INVALID_INPUT | Generic invalid input |
| -6 | INVALID_SIGNATURE | Invalid cryptographic signature |
| -7 | INVALID_SELECTOR | Invalid ABI function selector |
| -8 | UNSUPPORTED_TYPE | Unsupported ABI type |
| -9 | MAX_LENGTH_EXCEEDED | Data exceeds maximum allowed length |
| -10 | ACCESS_LIST_INVALID | Invalid EIP-2930 access list |
| -11 | AUTHORIZATION_INVALID | Invalid EIP-7702 authorization |

## License

MIT
