# KeystoreV3 and EncryptedKey Implementation Notes

## Status: BLOCKED - Requires Crypto Dependencies

The KeystoreV3 and EncryptedKey types cannot be implemented yet because they require cryptographic dependencies that are not currently available or fully integrated in the Voltaire codebase.

## Required Crypto Dependencies

### 1. Scrypt (KDF)
- **Purpose**: Memory-hard key derivation function (recommended for keystores)
- **Status**: Available in `lib/libwally-core/src/scrypt/` but not exposed to TypeScript
- **Needed**: TypeScript/WASM bindings for scrypt
- **Parameters**: n (CPU cost), r (block size), p (parallelization), dklen (derived key length)
- **Standard values**: n=262144, r=8, p=1, dklen=32

### 2. PBKDF2 (KDF - Legacy)
- **Purpose**: Password-based key derivation (legacy support)
- **Status**: Available in Web Crypto API (`crypto.subtle.deriveBits`)
- **Needed**: None (can use Web Crypto)
- **Parameters**: iterations, hash (typically SHA-256), salt, dklen

### 3. AES-128-CTR (Cipher)
- **Purpose**: Encryption cipher for keystore
- **Status**: NOT available (AES-GCM exists, but need AES-CTR mode)
- **Needed**: AES-CTR implementation or use existing AES-GCM with adaptation
- **Note**: Web3 Secret Storage spec requires AES-128-CTR specifically

### 4. Keccak256 (MAC)
- **Purpose**: Message authentication code for keystore validation
- **Status**: EXISTS in Voltaire crypto module
- **Needed**: None (already available)
- **Usage**: MAC = keccak256(derivedKey[16:32] || ciphertext)

## Type Specifications

### KeystoreV3
```typescript
type KeystoreV3 = {
  readonly version: 3;
  readonly id: string; // UUID v4
  readonly address: Address; // Without 0x prefix
  readonly crypto: {
    readonly cipher: "aes-128-ctr";
    readonly ciphertext: string; // Hex-encoded
    readonly cipherparams: {
      readonly iv: string; // 16-byte hex IV
    };
    readonly kdf: "scrypt" | "pbkdf2";
    readonly kdfparams: ScryptParams | Pbkdf2Params;
    readonly mac: string; // keccak256(derivedKey[16:32] || ciphertext)
  };
};

type ScryptParams = {
  readonly dklen: number; // 32
  readonly n: number; // 262144 (standard), 4096 (light)
  readonly p: number; // 1
  readonly r: number; // 8
  readonly salt: string; // 32-byte hex
};

type Pbkdf2Params = {
  readonly dklen: number; // 32
  readonly c: number; // Iteration count (600000+)
  readonly prf: "hmac-sha256";
  readonly salt: string; // 32-byte hex
};
```

### EncryptedKey
```typescript
type EncryptedKey = {
  readonly ciphertext: Uint8Array;
  readonly iv: Uint8Array; // Initialization vector (16 bytes)
  readonly salt: Uint8Array; // For KDF (32 bytes)
  readonly mac: Uint8Array; // Authentication tag (32 bytes)
};
```

## Implementation Steps (When Dependencies Ready)

1. **Expose Scrypt to TypeScript**
   - Create Zig or Rust wrapper for scrypt
   - Build WASM module with scrypt support
   - Add TypeScript bindings

2. **Add AES-CTR Mode**
   - Option A: Implement AES-CTR in Zig/Rust
   - Option B: Use Web Crypto API (limited browser support)
   - Option C: Use library like @noble/ciphers

3. **Implement KeystoreV3**
   - Location: `src/primitives/KeystoreV3/`
   - Files needed:
     - `KeystoreV3Type.ts` - Type definition
     - `from.js` - Parse keystore JSON
     - `encrypt.js` - Encrypt private key
     - `decrypt.js` - Decrypt private key
     - `verify.js` - Verify MAC before decrypt
     - `index.ts` - Public API
     - `KeystoreV3.test.ts` - Tests with Web3 test vectors

4. **Implement EncryptedKey**
   - Location: `src/primitives/EncryptedKey/`
   - Files needed:
     - `EncryptedKeyType.ts` - Type definition
     - `from.js` - Constructor
     - `toKeystore.js` - Convert to KeystoreV3
     - `verify.js` - Verify MAC
     - `index.ts` - Public API
     - `EncryptedKey.test.ts` - Tests

## Security Considerations

1. **Constant-time operations**: KDF and MAC verification must be constant-time
2. **Memory clearing**: Clear sensitive data (password, derived keys) after use
3. **Strong parameters**: Use strong KDF parameters (high n for scrypt, high iterations for PBKDF2)
4. **MAC verification**: Always verify MAC BEFORE attempting decryption
5. **Random salts/IVs**: Use cryptographically secure random generation

## References

- [Web3 Secret Storage Definition](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition)
- [EIP-2335: BLS12-381 Keystore](https://eips.ethereum.org/EIPS/eip-2335) (Similar format)
- [Scrypt RFC 7914](https://tools.ietf.org/html/rfc7914)
- Existing implementation: `examples/crypto/aesgcm/wallet-encryption.ts` (uses AES-GCM instead)

## Alternative Approach

Instead of implementing full KeystoreV3/EncryptedKey now, consider:

1. **Use existing AES-GCM example**: Already works, just uses different cipher
2. **Add conversion utilities**: Convert AES-GCM format to/from KeystoreV3 later
3. **Document differences**: Note that Voltaire uses modern AES-GCM instead of legacy AES-CTR

This would provide wallet encryption functionality immediately while deferring full Web3 Secret Storage compatibility until crypto dependencies are ready.
