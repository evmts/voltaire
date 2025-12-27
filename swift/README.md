# Voltaire Swift

Swift bindings for Voltaire Ethereum primitives.

## Requirements

- macOS 12+ / iOS 15+
- Swift 5.9+
- Zig 0.15+ (to build the native library)

## Building

First, build the Zig native library from the repo root:

```bash
zig build build-ts-native
```

Then build the Swift package:

```bash
cd swift
swift build
```

## Usage

```swift
import Voltaire

// Addresses
let addr = try Address(hex: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
print(addr.checksumHex)  // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
print(addr.isZero)       // false

// Keccak-256 hashing
let hash = Keccak256.hash("hello world")
print(hash.hex)  // 0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad

// Hex encoding/decoding
let bytes = try Hex.decode("0xdeadbeef")
let hex = Hex.encode(bytes)  // 0xdeadbeef

// U256 (256-bit unsigned int)
let one = try U256(hex: "0x01")
print(one.hex) // 0x0000..0001 (64 hex chars)

// Bytes32 (fixed 32 bytes)
let b32 = try Bytes32(hex: "0x" + String(repeating: "00", count: 32))
print(b32.hex)

// Keys: generate private key, derive public key, compress, and address
let priv = try PrivateKey.generate()
let pub = try priv.publicKey()
let compressed = try pub.compressed()   // 33 bytes (0x02/0x03 + X)
let address = try pub.address()         // Address from public key
print(address.hex)

// Signatures (parse/serialize, canonicalize)
let r = [UInt8](repeating: 0, count: 31) + [0x01]
let s = [UInt8](repeating: 0, count: 31) + [0x02]
let sig = try Signature(compact: r + s)       // v defaults to 0
let normalized = sig.normalized()             // low-s normalization
let compact = normalized.serialize(includeV: false)
```

## Available Types

### Address
- `Address(hex:)` - Create from hex string
- `Address(bytes:)` - Create from raw bytes
- `Address.zero` - Zero address constant
- `.hex` - Lowercase hex string
- `.checksumHex` - EIP-55 checksummed hex
- `.bytes` - Raw byte array
- `.isZero` - Check if zero address
- `Address.isValidChecksum(_:)` - Validate EIP-55 checksum

### Hash
- `Hash(hex:)` - Create from hex string
- `Hash(bytes:)` - Create from raw bytes
- `Hash.zero` - Zero hash constant
- `.hex` - Hex string representation
- `.bytes` - Raw byte array

### Keccak256
- `Keccak256.hash(_:)` - Hash string, bytes, or Data

### Hex
- `Hex.encode(_:)` - Encode bytes to hex string
- `Hex.decode(_:)` - Decode hex string to bytes

### U256
- `U256(hex:)` - Create from hex string (0x-prefixed or not)
- `U256(bytes:)` - Create from 32 big-endian bytes
- `.hex` - 0x + 64 hex chars (padded)
- `.bytes` - Raw 32 bytes (big-endian)
- `.zero` - Zero value

### Bytes32
- `Bytes32(hex:)` - Create from hex string
- `Bytes32(bytes:)` - Create from 32 raw bytes
- `.hex` - 0x + 64 hex chars
- `.bytes` - Raw 32 bytes
- `.zero` - Zero 32-bytes

### PrivateKey
- `PrivateKey.generate()` - Generate a random valid secp256k1 private key
- `PrivateKey(bytes:)` - Create from 32 raw bytes
- `.publicKey()` - Derive uncompressed 64-byte public key
- `.bytes` - Raw 32 bytes

### PublicKey
- `PublicKey(uncompressed:)` - Create from 64-byte uncompressed key (x||y)
- `.compressed()` - Get 33-byte SEC1 compressed form
- `.address()` - Derive Ethereum address from public key

### Signature
- `Signature(compact:)` - Parse 64/65-byte compact signature (r||s||[v])
- `Signature(r:s:v:)` - Construct from components
- `.serialize(includeV:)` - Serialize to 64/65-byte compact form
- `.isCanonical` / `.normalized()` - Low-s checks/normalization
- `.recoverPublicKey(messageHash:)` - Recover 64-byte uncompressed key
- `.recoverAddress(messageHash:)` - Recover signer’s address

## Architecture

Swift files are colocated with their Zig/TypeScript counterparts:

```
src/primitives/Address/
├── Address.zig      # Zig implementation
├── Address.ts       # TypeScript implementation
└── Address.swift    # Swift wrapper (symlinked to swift/Sources/Voltaire/)
```

The Swift package links against `libprimitives_ts_native.dylib` built by Zig.

## Testing

```bash
cd swift
swift test
```

## License

MIT
