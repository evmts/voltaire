# Implement Keystore Encryption (Web3 Secret Storage)

## Context

OX comparison revealed they have JSON keystore encryption/decryption. This is the standard Web3 Secret Storage Definition format for securely storing private keys with password encryption.

## Requirements

1. **TypeScript API**:
   ```typescript
   // In src/crypto/Keystore/ or similar
   export interface KeystoreV3 {
     version: 3
     id: string // UUID
     address: string
     crypto: {
       cipher: 'aes-128-ctr'
       ciphertext: string
       cipherparams: { iv: string }
       kdf: 'scrypt' | 'pbkdf2'
       kdfparams: ScryptParams | Pbkdf2Params
       mac: string
     }
   }

   export function encrypt(
     privateKey: PrivateKey,
     password: string,
     options?: EncryptOptions
   ): KeystoreV3

   export function decrypt(
     keystore: KeystoreV3,
     password: string
   ): PrivateKey
   ```

2. **KDF Support**:
   - **Scrypt** (recommended): Memory-hard, resistant to ASIC attacks
   - **PBKDF2** (legacy): For compatibility with older keystores

3. **Encryption**:
   - Cipher: AES-128-CTR (can use existing AES-GCM infrastructure)
   - Derive 32-byte key from password using KDF
   - Split: First 16 bytes for AES, next 16 bytes for MAC
   - MAC: keccak256(derivedKey[16:32] || ciphertext)

4. **Implementation**:
   - Use existing AES-GCM or add AES-CTR in Zig
   - Use existing Keccak256
   - Add Scrypt (consider using @noble/hashes or Zig impl)
   - Add PBKDF2 (consider using crypto.subtle or Zig impl)
   - Generate random IV and UUID

5. **Validation**:
   - Verify MAC before decryption
   - Validate keystore structure
   - Check version (only v3 supported)
   - Validate KDF parameters (reasonable n, r, p for scrypt)

6. **Testing**:
   - Test vectors from Web3 Secret Storage spec
   - Test with both scrypt and pbkdf2
   - Test round-trip: decrypt(encrypt(key, pwd), pwd) == key
   - Test wrong password rejection
   - Test corrupted keystore rejection
   - Cross-validate with OX, ethers, geth

7. **Documentation**:
   - JSDoc with keystore examples
   - Link to Web3 Secret Storage Definition
   - Security best practices (strong passwords, KDF params)
   - Performance notes (scrypt is slow by design)

## Reference

OX implementation: `node_modules/ox/core/Keystore.ts`
Spec: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition

## Priority

**MEDIUM** - Important for wallet implementations

## Security Notes

- **Password strength**: Weak passwords make encryption pointless
- **KDF parameters**: Higher = more secure but slower
- **Memory clearing**: Clear password and derived key from memory after use (Zig advantage)
- **MAC verification**: Always verify MAC before attempting decryption
