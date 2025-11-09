# SHA256 Examples

Comprehensive examples demonstrating SHA-256 hash function usage in both TypeScript and Zig.

## Examples

### 1. Basic Usage (`basic-usage.ts` / `basic-usage.zig`)
Fundamental SHA-256 operations:
- Hashing raw bytes, strings, and hex data
- Converting output to hex
- NIST test vector validation
- Unicode string handling
- Deterministic output
- Avalanche effect demonstration

### 2. Bitcoin Address Derivation (`bitcoin-addresses.ts` / `bitcoin-addresses.zig`)
Bitcoin P2PKH address generation:
- SHA-256 hash of public key
- RIPEMD-160 hash of SHA-256 hash
- Base58Check encoding
- Double SHA-256 checksum
- Genesis block example

### 3. Streaming API (`streaming-api.ts` / `streaming-api.zig`)
Incremental hashing for large data:
- One-shot vs streaming comparison
- Chunk size independence
- File hashing with progress tracking
- Memory-efficient processing
- Optimal chunk sizes
- Hasher lifecycle

### 4. HMAC-SHA256 (`hmac.ts` / `hmac.zig`)
Hash-based Message Authentication Code:
- HMAC construction from scratch
- Key derivation and padding
- Message authentication
- Constant-time verification
- Comparison with insecure approaches
- API request signing example
- RFC 4231 test vectors

### 5. Merkle Tree (`merkle-tree.ts` / `merkle-tree.zig`)
Building authenticated data structures:
- Merkle tree construction
- Bitcoin-style double hashing
- Merkle proof generation
- Proof verification
- Odd number of leaves handling
- Large tree efficiency analysis

### 6. Comparison with Keccak256 (`comparison.ts` / `comparison.zig`)
SHA-256 vs Keccak-256 differences:
- Algorithm comparison
- Bitcoin vs Ethereum use cases
- Function selector differences
- Address derivation comparison
- Performance benchmarking
- Security properties
- When to use each

### 7. Test Vectors (`test-vectors.ts` / `test-vectors.zig`)
NIST FIPS 180-4 validation:
- Empty string hash
- Standard test messages
- 448-bit and 896-bit messages
- One million 'a' characters
- Edge cases (zeros, ones)
- Unicode validation
- Complete test suite

## Running Examples

### TypeScript
```bash
# Run individual example
bun run examples/crypto/sha256/basic-usage.ts

# Run all examples
for f in examples/crypto/sha256/*.ts; do
  echo "Running $f"
  bun run "$f"
done
```

### Zig
```bash
# Run individual example
zig build && zig run examples/crypto/sha256/basic-usage.zig

# Or use build system (if configured)
zig build example-sha256-basic
```

## Key Concepts Demonstrated

1. **One-shot hashing**: `SHA256.hash()` for complete data
2. **Streaming API**: `SHA256.create()`, `update()`, `digest()` for large files
3. **Double SHA-256**: Bitcoin's extra security layer
4. **HMAC**: Secure message authentication
5. **Merkle trees**: Efficient data verification
6. **Test vectors**: Validation against standards

## When to Use SHA-256

✅ **Use SHA-256 for:**
- Bitcoin/blockchain applications
- Digital signatures
- Certificate fingerprints
- HMAC message authentication
- File integrity verification
- General-purpose cryptographic hashing

❌ **Don't use SHA-256 for:**
- Password hashing (use Argon2/scrypt/bcrypt)
- Ethereum smart contracts (use Keccak-256)
- Random number generation

## Security Notes

- SHA-256 provides 256-bit preimage resistance, 128-bit collision resistance
- No known practical attacks as of 2025
- Constant-time comparisons prevent timing attacks
- Hardware acceleration (SHA-NI) provides 10-20x speedup
- HMAC-SHA256 prevents length extension attacks

## References

- [NIST FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) - Official SHA-256 specification
- [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) - HMAC-SHA256 test vectors
- [Bitcoin Developer Guide](https://developer.bitcoin.org/) - Bitcoin usage patterns
- SHA256 Documentation: `/src/content/docs/crypto/sha256/`
