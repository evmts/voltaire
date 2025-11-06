# Add Signature Validation and Length Checks

## Context

OX comparison identified that signature deserialization should validate format before parsing to avoid processing malformed data. Add comprehensive validation to signature handling.

## Requirements

1. **Length Validation**:
   ```typescript
   // Before deserialization
   function validateSignatureLength(bytes: Uint8Array): void {
     if (bytes.length !== 65 && bytes.length !== 64) {
       throw new InvalidSignatureLengthError({ length: bytes.length })
     }
   }
   ```

2. **Component Validation**:
   ```typescript
   // Validate r, s, v components
   function validateSignatureComponents(r: bigint, s: bigint, v: number): void {
     // r, s must be in [1, n-1] where n is secp256k1 order
     // v must be 27, 28 (legacy) or 0, 1 (yParity)
   }
   ```

3. **Malleability Check**:
   ```typescript
   // Reject high-s values (BIP-62)
   function validateLowS(s: bigint): void {
     const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n
     const SECP256K1_N_DIV_2 = SECP256K1_N / 2n
     if (s > SECP256K1_N_DIV_2) {
       throw new SignatureMalleabilityError({ s })
     }
   }
   ```

4. **Format Detection**:
   ```typescript
   // Detect and validate signature format
   function detectSignatureFormat(bytes: Uint8Array): 'compact' | 'full' | 'invalid'
   ```

5. **Implementation**:
   - Add validation in signature deserialization (fromBytes, fromHex)
   - Add validation in transaction signature parsing
   - Provide option to normalize high-s to low-s
   - Clear error messages with actual vs expected values

6. **Testing**:
   - Test valid signatures (both formats)
   - Test invalid lengths (0, 1, 63, 66, 100 bytes)
   - Test invalid r, s values (0, n, n+1)
   - Test invalid v values (2, 26, 29)
   - Test high-s malleability
   - Test normalized signatures

7. **Documentation**:
   - JSDoc explaining signature formats
   - BIP-62 malleability explanation
   - When normalization is appropriate

## Reference

OX implementation: `node_modules/ox/core/Signature.ts` lines 140-149

## Priority

**MEDIUM** - Security and robustness improvement
