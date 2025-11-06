# Validate RLP Canonical Encoding

## Context

OX comparison identified that RLP decoding should reject non-canonical encodings. Canonical encoding ensures deterministic serialization and prevents malicious use of equivalent but differently encoded data.

## Background

RLP canonical encoding rules:
- Integers must use minimum bytes (no leading zeros)
- Strings/bytes must use shortest length prefix
- Single byte < 0x80 must not be encoded as string

## Requirements

1. **Canonical Integer Validation**:
   ```typescript
   // Reject integers with leading zeros
   function validateCanonicalInteger(bytes: Uint8Array): void {
     if (bytes.length > 1 && bytes[0] === 0) {
       throw new NonCanonicalRlpError('Integer has leading zeros')
     }
   }
   ```

2. **Canonical String Validation**:
   ```typescript
   // Single byte < 0x80 must not use string encoding
   function validateCanonicalString(bytes: Uint8Array, prefix: number): void {
     if (bytes.length === 1 && bytes[0]! < 0x80 && prefix !== bytes[0]) {
       throw new NonCanonicalRlpError('Single byte must not use string encoding')
     }
   }
   ```

3. **Minimal Length Prefix**:
   ```typescript
   // Verify length prefix uses minimum bytes
   function validateMinimalLengthPrefix(length: number, prefixBytes: number): void {
     const minBytes = minimumBytesFor(length)
     if (prefixBytes > minBytes) {
       throw new NonCanonicalRlpError('Length prefix not minimal')
     }
   }
   ```

4. **Implementation**:
   - Add validation in RLP decode function
   - Option to enable/disable strict canonical checking
   - Default: strict mode ON for security
   - Clear error messages indicating non-canonical encoding

5. **Testing**:
   - Test canonical encodings (should pass)
   - Test integer with leading zero (should fail)
   - Test single byte with string encoding (should fail)
   - Test non-minimal length prefix (should fail)
   - Test round-trip: decode(encode(x)) == x
   - Cross-validate with Ethereum clients

6. **Documentation**:
   - JSDoc explaining canonical encoding rules
   - Link to RLP spec
   - Security implications of non-canonical data
   - When to disable strict mode (if ever)

## Reference

OX implementation: `node_modules/ox/core/Rlp.ts` (check if they validate)
Ethereum Yellow Paper: Appendix B (RLP)

## Priority

**MEDIUM** - Important for strict consensus compatibility

## Security Note

Non-canonical RLP could be exploited for:
- Cache poisoning attacks
- Signature bypass attempts
- Transaction malleability
