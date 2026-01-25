# Crypto Hash & Encryption Modules Review

## Overview

Review of hash (Keccak256, SHA256, Blake2, Ripemd160) and encryption (AesGcm, ChaCha20Poly1305, HMAC) modules in voltaire-effect.

**Status**: Generally well-implemented with proper Effect patterns. A few security and consistency issues identified.

---

## Issues

### 1. AesGcm: Missing Input Validation for Key/Nonce Sizes

**Priority**: High (Security)

**Location**: `src/crypto/AesGcm/operations.ts#L39-51`

**Problem**: `encrypt` and `decrypt` accept any `Uint8Array` for key and nonce without validating sizes before calling the underlying crypto. Invalid sizes may throw at the Web Crypto layer with unclear error messages.

```typescript
// Current - no size validation:
export const encrypt = (
  key: Uint8Array,
  plaintext: Uint8Array,
  nonce: Uint8Array,
  aad?: Uint8Array,
): Effect.Effect<Uint8Array, Error> =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await AesGcm.importKey(key);
      return AesGcm.encrypt(plaintext, cryptoKey, nonce, aad);
    },
    catch: (e) => e as Error,
  });
```

**Solution**: Add explicit validation with typed errors:

```typescript
import * as Data from "effect/Data";

export class InvalidKeySizeError extends Data.TaggedError("InvalidKeySizeError")<{
  readonly expected: number[];
  readonly received: number;
}> {}

export class InvalidNonceSizeError extends Data.TaggedError("InvalidNonceSizeError")<{
  readonly expected: number;
  readonly received: number;
}> {}

export const encrypt = (
  key: Uint8Array,
  plaintext: Uint8Array,
  nonce: Uint8Array,
  aad?: Uint8Array,
): Effect.Effect<Uint8Array, InvalidKeySizeError | InvalidNonceSizeError | Error> =>
  Effect.gen(function* () {
    if (key.length !== 16 && key.length !== 32) {
      return yield* Effect.fail(new InvalidKeySizeError({ expected: [16, 32], received: key.length }));
    }
    if (nonce.length !== 12) {
      return yield* Effect.fail(new InvalidNonceSizeError({ expected: 12, received: nonce.length }));
    }
    return yield* Effect.tryPromise({
      try: async () => {
        const cryptoKey = await AesGcm.importKey(key);
        return AesGcm.encrypt(plaintext, cryptoKey, nonce, aad);
      },
      catch: (e) => e as Error,
    });
  });
```

**Acceptance Criteria**:
- [ ] Add `InvalidKeySizeError` and `InvalidNonceSizeError` typed errors
- [ ] Validate key size (16 or 32 bytes) before encryption/decryption
- [ ] Validate nonce size (12 bytes) before encryption/decryption
- [ ] Update error type in return signature
- [ ] Add tests for invalid key/nonce sizes

---

### 2. ChaCha20Poly1305: Missing Input Validation

**Priority**: High (Security)

**Location**: `src/crypto/ChaCha20Poly1305/ChaCha20Poly1305Service.ts#L108-118`

**Problem**: No validation for key (32 bytes) and nonce (12 bytes) sizes. Invalid inputs may cause undefined behavior or cryptic errors.

```typescript
// Current - calls underlying lib without validation:
encrypt: (plaintext, key, nonce, additionalData) =>
  Effect.sync(() =>
    ChaCha20Poly1305.encrypt(plaintext, key, nonce, additionalData),
  ),
```

**Solution**: Add validation in the Live layer:

```typescript
encrypt: (plaintext, key, nonce, additionalData) =>
  Effect.gen(function* () {
    if (key.length !== 32) {
      return yield* Effect.die(new Error(`Key must be 32 bytes, got ${key.length}`));
    }
    if (nonce.length !== 12) {
      return yield* Effect.die(new Error(`Nonce must be 12 bytes, got ${nonce.length}`));
    }
    return ChaCha20Poly1305.encrypt(plaintext, key, nonce, additionalData);
  }),
```

**Acceptance Criteria**:
- [ ] Validate key is exactly 32 bytes
- [ ] Validate nonce is exactly 12 bytes
- [ ] Add typed error classes similar to AesGcm
- [ ] Add tests for invalid input sizes

---

### 3. Blake2: Missing Output Length Validation

**Priority**: Medium

**Location**: `src/crypto/Blake2/Blake2Service.ts#L88-91`

**Problem**: `outputLength` parameter is optional with default 64, but values outside 1-64 range are not validated.

```typescript
// Current - no range validation:
export const Blake2Live = Layer.succeed(Blake2Service, {
  hash: (data, outputLength = 64) =>
    Effect.sync(() => Blake2.hash(data, outputLength)),
});
```

**Solution**: Add range validation:

```typescript
hash: (data, outputLength = 64) =>
  Effect.gen(function* () {
    if (outputLength < 1 || outputLength > 64) {
      return yield* Effect.die(new Error(`Output length must be 1-64, got ${outputLength}`));
    }
    return Blake2.hash(data, outputLength);
  }),
```

**Acceptance Criteria**:
- [ ] Validate outputLength is in range 1-64
- [ ] Add typed error for invalid output length
- [ ] Add test for invalid output length

---

### 4. AesGcm: Test Layer Doesn't Match Service Interface Semantics

**Priority**: Low

**Location**: `src/crypto/AesGcm/index.ts#L91-96`

**Problem**: Test layer ignores input parameters, which can mask bugs in tests. For example, `decrypt` always returns a fixed-size array regardless of ciphertext.

```typescript
// Current - parameters ignored:
export const AesGcmTest = Layer.succeed(AesGcmService, {
  encrypt: () => Effect.succeed(new Uint8Array(32)),
  decrypt: () => Effect.succeed(new Uint8Array(16)),
  generateKey: () => Effect.succeed(new Uint8Array(32)),
  generateNonce: () => Effect.succeed(new Uint8Array(12)),
});
```

**Solution**: Make test layer slightly more realistic:

```typescript
export const AesGcmTest = Layer.succeed(AesGcmService, {
  encrypt: (_key, plaintext, _nonce, _aad) =>
    Effect.succeed(new Uint8Array(plaintext.length + 16)), // ciphertext + tag
  decrypt: (_key, ciphertext, _nonce, _aad) =>
    Effect.succeed(new Uint8Array(Math.max(0, ciphertext.length - 16))),
  generateKey: (bits = 256) => Effect.succeed(new Uint8Array(bits / 8)),
  generateNonce: () => Effect.succeed(new Uint8Array(12)),
});
```

**Acceptance Criteria**:
- [ ] Update test layer to respect input sizes
- [ ] Encrypt returns plaintext.length + 16
- [ ] Decrypt returns ciphertext.length - 16
- [ ] generateKey respects bits parameter

---

### 5. AesGcm Operations: Inconsistent Service Usage Pattern

**Priority**: Low (Consistency)

**Location**: `src/crypto/AesGcm/operations.ts`

**Problem**: AesGcm operations are standalone functions that don't use the service pattern, unlike ChaCha20Poly1305 operations which go through the service. This is inconsistent.

```typescript
// AesGcm - calls library directly:
export const encrypt = (key, plaintext, nonce, aad) =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await AesGcm.importKey(key);
      return AesGcm.encrypt(plaintext, cryptoKey, nonce, aad);
    },
    catch: (e) => e as Error,
  });

// ChaCha20Poly1305 - goes through service:
export const encrypt = (plaintext, key, nonce, additionalData) =>
  Effect.gen(function* () {
    const service = yield* ChaCha20Poly1305Service;
    return yield* service.encrypt(plaintext, key, nonce, additionalData);
  });
```

**Solution**: Either:
1. Make AesGcm operations go through the service (preferred for consistency)
2. Make ChaCha20Poly1305 operations standalone (less idiomatic)

**Acceptance Criteria**:
- [ ] Choose consistent pattern across encryption modules
- [ ] Update implementations to match chosen pattern
- [ ] Ensure both can be tested with mock layers

---

### 6. Missing Known Vector Tests for SHA256, Blake2, Ripemd160

**Priority**: Medium (Test Coverage)

**Location**: 
- `src/crypto/SHA256/SHA256.test.ts`
- `src/crypto/Blake2/Blake2.test.ts`
- `src/crypto/Ripemd160/Ripemd160.test.ts`

**Problem**: Unlike Keccak256.test.ts which has comprehensive known vector tests, other hash modules only check output length and first few bytes.

```typescript
// Keccak256 - has full known vectors:
expect(bytesToHex(result)).toBe(
  "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
);

// SHA256 - only checks first bytes:
expect(result[0]).toBe(0xe3);
expect(result[1]).toBe(0xb0);
```

**Solution**: Add full known vector tests:

```typescript
// SHA256 known vectors
it("matches known vector: empty string", async () => {
  const result = await Effect.runPromise(
    hash(new Uint8Array(0)).pipe(Effect.provide(SHA256Live))
  );
  expect(bytesToHex(result)).toBe(
    "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
});

it('matches known vector: "abc"', async () => {
  const result = await Effect.runPromise(
    hash(new TextEncoder().encode("abc")).pipe(Effect.provide(SHA256Live))
  );
  expect(bytesToHex(result)).toBe(
    "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});
```

**Acceptance Criteria**:
- [ ] Add full hex known vectors for SHA256 (empty, "abc", "hello")
- [ ] Add full hex known vectors for Blake2 (empty, various lengths)
- [ ] Add full hex known vectors for Ripemd160 (empty, "abc")
- [ ] Add full hex known vectors for HMAC (RFC 4231 test vectors)

---

### 7. ChaCha20Poly1305: Decrypt Should Have Error Type for Auth Failure

**Priority**: Medium

**Location**: `src/crypto/ChaCha20Poly1305/ChaCha20Poly1305Service.ts#L43-48`

**Problem**: Decrypt returns `Effect<Uint8Array>` with no error type, but authentication failures should be explicitly typed. The service shape says "never fails" but decryption can fail on auth.

```typescript
readonly decrypt: (
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  additionalData?: Uint8Array,
) => Effect.Effect<Uint8Array>;  // Missing error type
```

**Solution**: Add explicit error type:

```typescript
import * as Data from "effect/Data";

export class AuthenticationFailedError extends Data.TaggedError("AuthenticationFailedError")<{
  readonly message: string;
}> {}

readonly decrypt: (
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  additionalData?: Uint8Array,
) => Effect.Effect<Uint8Array, AuthenticationFailedError>;
```

**Acceptance Criteria**:
- [ ] Add `AuthenticationFailedError` typed error
- [ ] Update decrypt signature to include error type
- [ ] Update Live layer to catch and wrap auth failures
- [ ] Add test for auth failure (tampered ciphertext)

---

### 8. Missing Tests for Authentication Failures

**Priority**: Medium (Test Coverage)

**Location**: 
- `src/crypto/AesGcm/AesGcm.test.ts`
- `src/crypto/ChaCha20Poly1305/ChaCha20Poly1305.test.ts`

**Problem**: No tests verify that tampered ciphertext fails authentication.

**Solution**: Add auth failure tests:

```typescript
it("fails on tampered ciphertext", async () => {
  const key = await Effect.runPromise(generateKey());
  const nonce = await Effect.runPromise(generateNonce());
  const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

  const ciphertext = await Effect.runPromise(
    encrypt(key, plaintext, nonce)
  );
  
  // Tamper with ciphertext
  ciphertext[0] ^= 0xff;
  
  const result = await Effect.runPromise(
    Effect.either(decrypt(key, ciphertext, nonce))
  );
  
  expect(Either.isLeft(result)).toBe(true);
});

it("fails with wrong AAD", async () => {
  const key = await Effect.runPromise(generateKey());
  const nonce = await Effect.runPromise(generateNonce());
  const plaintext = new Uint8Array([1, 2, 3]);
  const aad = new Uint8Array([10, 20, 30]);
  
  const ciphertext = await Effect.runPromise(
    encrypt(key, plaintext, nonce, aad)
  );
  
  // Decrypt with different AAD
  const result = await Effect.runPromise(
    Effect.either(decrypt(key, ciphertext, nonce, new Uint8Array([99])))
  );
  
  expect(Either.isLeft(result)).toBe(true);
});
```

**Acceptance Criteria**:
- [ ] Add test for tampered ciphertext failure (AesGcm)
- [ ] Add test for tampered ciphertext failure (ChaCha20Poly1305)
- [ ] Add test for wrong AAD failure (AesGcm)
- [ ] Add test for wrong AAD failure (ChaCha20Poly1305)
- [ ] Add test for wrong key failure
- [ ] Add test for wrong nonce failure

---

### 9. HMAC: No Minimum Key Length Warning/Enforcement

**Priority**: Low (Security Best Practice)

**Location**: `src/crypto/HMAC/HMACService.ts`

**Problem**: HMAC accepts keys of any length, including empty keys. RFC 2104 recommends key length >= hash output size (32 for SHA256, 64 for SHA512).

**Solution**: Add validation or at least document the security implications:

```typescript
sha256: (key, message) =>
  Effect.gen(function* () {
    if (key.length < 32) {
      console.warn(`HMAC-SHA256: key length ${key.length} < 32 bytes recommended`);
    }
    return HMAC.sha256(key, message);
  }),
```

Or use typed warning:
```typescript
export class WeakKeyWarning extends Data.TaggedError("WeakKeyWarning")<{
  readonly minRecommended: number;
  readonly actual: number;
}> {}
```

**Acceptance Criteria**:
- [ ] Consider adding key length validation (or just documentation)
- [ ] Add test with weak key to verify behavior documented

---

## Summary

| Issue | Priority | Type |
|-------|----------|------|
| AesGcm missing key/nonce validation | High | Security |
| ChaCha20Poly1305 missing input validation | High | Security |
| Blake2 missing output length validation | Medium | Validation |
| Missing known vector tests | Medium | Test Coverage |
| ChaCha20Poly1305 decrypt missing error type | Medium | Type Safety |
| Missing auth failure tests | Medium | Test Coverage |
| AesGcm test layer semantics | Low | Consistency |
| AesGcm/ChaCha inconsistent patterns | Low | Consistency |
| HMAC weak key warning | Low | Best Practice |

## What's Good

1. **Proper Effect patterns**: Services correctly use `Context.Tag`, `Layer.succeed`, and Effect wrapping
2. **Test layers**: All services have `*Test` layers for deterministic testing
3. **Documentation**: Excellent JSDoc comments with examples
4. **Type safety**: Branded types used for hash outputs (`Keccak256Hash`, `SHA256Hash`, etc.)
5. **Composability**: Services can be composed with `Layer.merge`
6. **Keccak256 test coverage**: Comprehensive known vector tests serve as good template
