# Implement Signature Serialization

## Context

OX comparison revealed we're missing comprehensive signature serialization functions. Essential for signing workflows, transaction serialization, and interoperability.

## Requirements

1. **TypeScript API**:
   ```typescript
   // In src/crypto/secp256k1/Signature/index.ts or similar
   export function toHex(signature: BrandedSignature): Hex
   export function toBytes(signature: BrandedSignature): Uint8Array
   export function fromHex(hex: Hex): BrandedSignature
   export function fromBytes(bytes: Uint8Array): BrandedSignature
   export function toCompact(signature: BrandedSignature): Uint8Array // 64 bytes r+s
   export function fromCompact(compact: Uint8Array, recovery?: number): BrandedSignature
   ```

2. **Formats**:
   - **Standard (65 bytes)**: r (32) + s (32) + v (1) or yParity (1)
   - **Compact (64 bytes)**: r (32) + s (32) only
   - **DER encoding** (variable): Consider for future compatibility

3. **Validation**:
   - Length checking before deserialization
   - Validate r, s are in valid range [1, n-1]
   - Validate v/yParity values (27/28 or 0/1)
   - Reject malleability (high-s values per BIP-62)

4. **Legacy Support**:
   - Handle v (27/28) vs yParity (0/1) conversion
   - Support EIP-155 chainId-encoded v values
   - Document which format to use when

5. **Testing**:
   - Test vectors for all formats
   - Round-trip serialization
   - Cross-validate with OX and @noble/curves
   - Test malformed input rejection
   - Test high-s malleability rejection

6. **Documentation**:
   - JSDoc explaining signature formats
   - When to use compact vs full format
   - EIP-155 v calculation
   - Malleability considerations

## Reference

OX implementation: `node_modules/ox/core/Signature.ts`

## Priority

**HIGH** - Required for most signing workflows
