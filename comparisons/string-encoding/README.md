# UTF-8 String Encoding Benchmarks

Comprehensive benchmarks comparing UTF-8 string encoding/decoding implementations across **guil** (@tevm/primitives), **ethers**, and **viem**.

## Why This Matters

String encoding is a **critical operation** in every Ethereum message signing workflow:

### EIP-191: Personal Sign
```typescript
// Every personal_sign call encodes a UTF-8 string
const message = "Sign in to MyApp";
const messageBytes = stringToBytes(message);
const hash = keccak256(messageBytes);
const signature = sign(hash, privateKey);
```

### EIP-712: Typed Data Signing
```typescript
// EIP-712 encodes string fields in structured data
const typedData = {
  types: {
    Message: [{ name: "content", type: "string" }]
  },
  message: { content: "Hello, World!" }
};
// String "Hello, World!" must be encoded to bytes before hashing
```

### Performance Impact

**High-frequency operations**: Wallet applications, dApp message signing, authentication flows

- **stringToBytes**: Called once per message sign operation
- **bytesToString**: Called when verifying or displaying signed messages
- **stringToHex**: Direct conversion for RPC calls and transaction data
- **hexToString**: Decoding on-chain messages and calldata

Even microsecond improvements matter when:
- Processing batch signatures
- Real-time message signing (chat, gaming)
- Server-side signature verification at scale
- Browser extension performance

## Functions Benchmarked

### 1. stringToBytes - UTF-8 String to Uint8Array

The fundamental encoding operation for message signing.

**Implementations:**
- **Guil**: Native `TextEncoder` API
- **Ethers**: `toUtf8Bytes(str)`
- **Viem**: `stringToBytes(str)` from `viem/utils`

### 2. bytesToString - Uint8Array to UTF-8 String

Decoding signed messages back to human-readable format.

**Implementations:**
- **Guil**: Native `TextDecoder` API
- **Ethers**: `toUtf8String(bytes)`
- **Viem**: `bytesToString(bytes)` from `viem/utils`

### 3. stringToHex - UTF-8 String to Hex

Direct string-to-hex conversion for RPC payloads.

**Implementations:**
- **Guil**: `TextEncoder` + inline `bytesToHex`
- **Ethers**: `hexlify(toUtf8Bytes(str))`
- **Viem**: `stringToHex(str)` from `viem/utils`

### 4. hexToString - Hex to UTF-8 String

Decoding hex-encoded on-chain messages.

**Implementations:**
- **Guil**: Inline `hexToBytes` + `TextDecoder`
- **Ethers**: `toUtf8String(getBytes(hex))`
- **Viem**: `hexToString(hex)` from `viem/utils`

## Test Data

Benchmarks use realistic data covering common use cases:

```typescript
{
  simple: 'Hello, World!',           // Basic ASCII message
  empty: '',                         // Edge case: empty string
  unicode: 'Hello 世界 🌍',          // Multi-byte UTF-8 characters
  long: 'a'.repeat(1000),            // Long message (1KB)
  ethMessage: 'Sign this message to authenticate'  // Typical auth message
}
```

## Unicode and UTF-8 Considerations

**Critical**: All implementations must correctly handle multi-byte UTF-8 characters:

- **CJK Characters** (Chinese/Japanese/Korean): 3 bytes per character
- **Emojis**: 4 bytes per character (e.g., 🌍 = `0xf09f8c8d`)
- **Proper encoding** prevents signature mismatches and security vulnerabilities

Example:
```typescript
// Incorrect byte counting can break signatures
const message = "Hello 世界";
// Correct UTF-8 encoding:  H e l l o space 世 界
//                          1 1 1 1 1 1     3  3  = 11 bytes
// Wrong (UCS-2 counting):                  = 7 characters (WRONG!)
```

## Security Implications

**Why proper UTF-8 encoding matters for security:**

1. **Signature Consistency**: Incorrect encoding produces different hashes, invalidating signatures
2. **Cross-platform Compatibility**: Different encodings cause signature verification failures
3. **Replay Attack Prevention**: Message encoding must be deterministic and standard-compliant

## Running the Benchmarks

```bash
# Run all string encoding benchmarks
npm run bench -- string-encoding

# Run specific function benchmarks
npm run bench -- string-encoding/stringToBytes
npm run bench -- string-encoding/bytesToString
npm run bench -- string-encoding/stringToHex
npm run bench -- string-encoding/hexToString
```

## Benchmark Structure

```
string-encoding/
├── stringToBytes/
│   ├── guil.ts          # Native TextEncoder implementation
│   ├── ethers.ts        # Ethers toUtf8Bytes
│   └── viem.ts          # Viem stringToBytes
├── bytesToString/
│   ├── guil.ts          # Native TextDecoder implementation
│   ├── ethers.ts        # Ethers toUtf8String
│   └── viem.ts          # Viem bytesToString
├── stringToHex/
│   ├── guil.ts          # TextEncoder + bytesToHex
│   ├── ethers.ts        # Ethers hexlify + toUtf8Bytes
│   └── viem.ts          # Viem stringToHex
├── hexToString/
│   ├── guil.ts          # hexToBytes + TextDecoder
│   ├── ethers.ts        # Ethers toUtf8String + getBytes
│   └── viem.ts          # Viem hexToString
├── stringToBytes.bench.ts
├── bytesToString.bench.ts
├── stringToHex.bench.ts
├── hexToString.bench.ts
├── docs.ts
└── README.md
```

## Expected Performance Characteristics

### Native APIs (TextEncoder/TextDecoder)
- **Pros**: Browser-optimized, zero dependencies, consistent across runtimes
- **Cons**: May lack advanced features like error handling modes

### Library Implementations
- **Pros**: Additional validation, error handling, consistent behavior
- **Cons**: Potential overhead from abstraction layers

### Real-world Impact

For a typical dApp with 1000 message signs per day:
- **1ms improvement** = 1 second saved daily
- **100µs improvement** = 100ms saved daily across all users
- Multiplied across millions of transactions = significant UX improvement

## Related Standards

- **EIP-191**: Signed Data Standard (uses stringToBytes for message prefix)
- **EIP-712**: Typed Structured Data Hashing (encodes string fields)
- **UTF-8**: RFC 3629 (Universal character encoding)
- **TextEncoder/TextDecoder**: WHATWG Encoding Standard

## Conclusion

String encoding performance directly impacts user experience in:
- Wallet signature prompts
- dApp authentication flows
- Message verification
- On-chain message decoding

These benchmarks help developers choose the most performant implementation for their use case while ensuring correct UTF-8 handling for security and compatibility.
