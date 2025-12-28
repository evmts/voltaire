# Swift Examples

Runnable Swift examples that use Voltaire’s Swift API.

## Prerequisites

- macOS 12+ / iOS 15+
- Swift 5.9+
- Zig 0.15+ (to build the native library)

## Build Once (from repo root)

```bash
# Build the Zig native library that the Swift package links against
zig build build-ts-native
```

## Run Examples

```bash
cd examples/swift-examples
swift run
```

You should see output demonstrating:
- Address parsing and EIP-55 checksum
- Keccak-256 hashing of strings and bytes
- Private key generation, public key derivation, and address derivation
- Hex encode/decode, U256 formatting, Bytes32 handling
 - Signature parsing, normalization, and public key/address recovery

## Notes

- The examples depend on the local Swift package in `../../swift`, which links to the Zig-produced `libprimitives_ts_native` in `zig-out/native`.
- If the dynamic library cannot be found at runtime, ensure you ran `zig build build-ts-native` from the repository root, and re-run `swift run`.

## Next Steps

If you want to integrate into your own app, see `docs-swift/getting-started.mdx` or `swift/README.md` for package usage as a dependency.
