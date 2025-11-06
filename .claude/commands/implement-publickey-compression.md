# Implement PublicKey Compress/Decompress

## Context

OX comparison revealed we're missing public key compression/decompression functions. These are essential for serialization compatibility with other libraries and for reducing storage/transmission overhead.

## Background

- **Uncompressed**: 65 bytes (0x04 + 32-byte x + 32-byte y)
- **Compressed**: 33 bytes (0x02/0x03 + 32-byte x, prefix indicates y parity)

## Requirements

1. **TypeScript API**:
   ```typescript
   // In src/crypto/secp256k1/PublicKey/index.ts or similar
   export function compress(publicKey: BrandedPublicKey): BrandedPublicKey
   export function decompress(publicKey: BrandedPublicKey): BrandedPublicKey
   export function isCompressed(publicKey: BrandedPublicKey): boolean
   ```

2. **Zig Implementation**:
   - Implement in appropriate secp256k1 module
   - **Compress**: Extract x-coordinate, compute y parity, format as 0x02/0x03 + x
   - **Decompress**: Extract x, solve curve equation y² = x³ + 7, choose y by parity
   - Validate point is on curve after decompression

3. **Validation**:
   - Check prefix bytes (0x04 for uncompressed, 0x02/0x03 for compressed)
   - Verify length (65 or 33 bytes)
   - Validate point on curve

4. **Testing**:
   - Test vectors with known compressed/uncompressed pairs
   - Round-trip: compress(decompress(key)) == key
   - Cross-validate with @noble/curves
   - Test edge cases (point at infinity, invalid points)

5. **Documentation**:
   - JSDoc explaining compressed vs uncompressed formats
   - When to use each format
   - Note: compressed preferred for storage, uncompressed for some legacy systems

## Reference

OX implementation: `node_modules/ox/core/PublicKey.ts:compress()` and `decompress()`

## Priority

**HIGH** - Required for serialization compatibility
