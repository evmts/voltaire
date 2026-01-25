# Crypto Test Quality Review

**Date**: 2026-01-25  
**Scope**: voltaire-effect/src/crypto/*

## Summary

| Module | Vectors | Edge Cases | Errors | Mock Layer | Assertions | Score |
|--------|---------|------------|--------|------------|------------|-------|
| Secp256k1 | ✅ Partial | ✅ Zero key | ✅ 2 | ❌ Missing | ⚠️ Loose | 7/10 |
| Ed25519 | ❌ None | ✅ Wrong length | ✅ 2 | ✅ Ed25519Test | ⚠️ Loose | 6/10 |
| Bls12381 | ❌ None | ✅ Zero key, empty | ✅ 2 | ❌ Missing | ⚠️ Loose | 5/10 |
| Keccak256 | ✅ 5 vectors | ✅ Empty, 0x00, 0xff | ❌ 0 | ✅ KeccakTest | ✅ Exact hex | 9/10 |
| SHA256 | ⚠️ 1 partial | ✅ Empty | ❌ 0 | ✅ SHA256Test | ⚠️ First 2 bytes | 6/10 |
| AesGcm | ❌ None | ❌ None | ❌ 0 | ⚠️ Incomplete | ⚠️ Loose | 4/10 |
| Bip39 | ⚠️ 1 known | ⚠️ Invalid phrase | ❌ 0 | ✅ Bip39Test | ⚠️ Loose | 6/10 |
| HDWallet | ❌ None | ❌ None | ❌ 0 | ✅ HDWalletTest | ⚠️ Loose | 5/10 |

**Overall Score: 6/10**

---

## Detailed Analysis

### 1. Secp256k1.test.ts

**Strengths:**
- Tests RFC 6979 determinism (lines 36-47, 194-216)
- Tests zero key rejection (lines 49-56)
- Tests invalid v value in recovery (lines 77-89)
- Verifies sign/recover/verify roundtrip
- Service layer tests complete

**Gaps:**
- ❌ No official ECDSA test vectors (NIST FIPS 186-4, Wycheproof)
- ❌ No test for private key at curve order boundary (n-1)
- ❌ No test for malleated signatures (high-S normalization)
- ❌ No `Secp256k1Test` mock layer tested
- ⚠️ Assertions use `toHaveProperty` instead of exact value checks

**Recommended additions:**
```typescript
// Wycheproof vector
it("matches Wycheproof test vector #1", async () => {
  const privateKey = hexToBytes("0x...");
  const messageHash = hexToBytes("0x...");
  const expectedR = hexToBytes("0x...");
  const expectedS = hexToBytes("0x...");
  // ...
});

// High-S normalization
it("normalizes high-S signatures", async () => {
  // Verify s <= n/2
});

// Boundary key
it("handles private key at n-1", async () => {
  const maxKey = secp256k1_n - 1n;
  // ...
});
```

---

### 2. Ed25519.test.ts

**Strengths:**
- Tests wrong key length error (lines 33-40, 95-102)
- Tests deterministic signatures
- Tests wrong message/wrong key verification
- ✅ Ed25519Test mock layer fully tested (lines 152-198)

**Gaps:**
- ❌ No RFC 8032 test vectors
- ❌ No all-zeros message test
- ❌ No max-length message test
- ❌ No cofactor-related edge cases
- ❌ No test for all-zero seed

**Recommended additions:**
```typescript
// RFC 8032 test vector 1
it("matches RFC 8032 test vector 1", async () => {
  // Known seed, message, expected signature
});

// Empty message
it("signs empty message", async () => {
  const sig = await Ed25519Effect.sign(new Uint8Array(0), secretKey);
  expect(sig.length).toBe(64);
});
```

---

### 3. Bls12381.test.ts

**Strengths:**
- Tests zero key failure (lines 33-40)
- Tests empty array aggregation failure (lines 104-108)
- Tests signature aggregation

**Gaps:**
- ❌ No EIP-2333/EIP-2537 test vectors
- ❌ No point-at-infinity test
- ❌ No aggregate verification test (`verifyAggregate`)
- ❌ No Bls12381Test mock layer
- ❌ Random keys make tests non-deterministic (lines 8-9)

**Critical issue:** Using `randomPrivateKey()` in tests (line 8) makes failures non-reproducible.

**Recommended additions:**
```typescript
// Use fixed keys for reproducibility
const TEST_PRIVATE_KEY = new Uint8Array([0x01, ...]);

// Aggregate verify
it("verifies aggregated signature", async () => {
  const aggSig = await aggregate([sig1, sig2]);
  const isValid = await verifyAggregate(aggSig, [msg, msg], [pk1, pk2]);
  expect(isValid).toBe(true);
});
```

---

### 4. Keccak256.test.ts ⭐ Best

**Strengths:**
- ✅ 5 known test vectors with exact hex comparison (lines 46-109)
- ✅ Empty input, single 0x00, single 0xff edge cases
- ✅ KeccakTest mock layer tested
- ✅ Assertions use exact hex strings

**Gaps:**
- ❌ No error path testing (invalid input types)
- ❌ No large input test (>1KB)

**Recommended additions:**
```typescript
it("hashes large input correctly", async () => {
  const largeInput = new Uint8Array(10000).fill(0xab);
  // Compare against known hash
});
```

---

### 5. SHA256.test.ts

**Strengths:**
- Tests empty input with partial verification
- SHA256Test mock layer tested

**Gaps:**
- ❌ Only checks first 2 bytes of empty hash (lines 31-33)
- ❌ No NIST CAVP test vectors
- ❌ No multi-block message test (>64 bytes)
- ❌ No error path testing

**Recommended additions:**
```typescript
// Full vector check
it("matches NIST empty string vector", async () => {
  const result = await hash(new Uint8Array(0));
  expect(bytesToHex(result)).toBe(
    "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
});

// Multi-block
it("hashes multi-block message", async () => {
  const input = new Uint8Array(128).fill(0x61); // 128 bytes
  // ...
});
```

---

### 6. AesGcm.test.ts

**Strengths:**
- Tests key sizes (128, 256)
- Tests AAD roundtrip

**Gaps:**
- ❌ No NIST SP 800-38D test vectors
- ❌ No error tests (wrong key, wrong nonce, tampered ciphertext)
- ❌ No nonce reuse detection test
- ❌ No AesGcmTest mock layer
- ❌ No empty plaintext test

**Critical issue:** No decryption failure tests - cannot verify authentication tag validation.

**Recommended additions:**
```typescript
// Tampered ciphertext
it("fails to decrypt tampered ciphertext", async () => {
  const ciphertext = await encrypt(key, plaintext, nonce);
  ciphertext[0] ^= 0xff; // Tamper
  const exit = await Effect.runPromiseExit(decrypt(key, ciphertext, nonce));
  expect(Exit.isFailure(exit)).toBe(true);
});

// Wrong key
it("fails with wrong key", async () => {
  const wrongKey = await generateKey();
  const exit = await Effect.runPromiseExit(decrypt(wrongKey, ciphertext, nonce));
  expect(Exit.isFailure(exit)).toBe(true);
});

// NIST vector
it("matches NIST GCM test vector", async () => {
  // Known key, nonce, plaintext, AAD, expected ciphertext+tag
});
```

---

### 7. Bip39.test.ts

**Strengths:**
- Uses known "abandon...about" mnemonic (BIP-39 test vector)
- Tests passphrase differentiation (lines 85-105)
- Tests invalid mnemonic rejection
- Bip39Test mock layer tested

**Gaps:**
- ❌ No full BIP-39 test vector verification (expected seed value)
- ❌ No wordlist edge cases (first word, last word)
- ❌ No entropy size validation error test
- ❌ No unicode normalization test

**Recommended additions:**
```typescript
// BIP-39 official vector
it("matches BIP-39 test vector: abandon x11 + about", async () => {
  const seed = await mnemonicToSeed(TEST_MNEMONIC);
  expect(bytesToHex(seed)).toBe(
    "0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4"
  );
});

// Invalid entropy
it("rejects invalid entropy size", async () => {
  const exit = await Effect.runPromiseExit(generateMnemonic(100)); // Invalid
  expect(Exit.isFailure(exit)).toBe(true);
});
```

---

### 8. HDWallet.test.ts

**Strengths:**
- Tests all service methods
- HDWalletTest mock layer used throughout

**Gaps:**
- ❌ No BIP-32 test vectors
- ❌ No BIP-44 path validation
- ❌ No hardened vs non-hardened derivation test
- ❌ No HDWalletLive tests (only mock layer)
- ❌ No invalid path error test
- ❌ No seed length validation

**Critical issue:** Only tests mock layer, no live implementation tests.

**Recommended additions:**
```typescript
// BIP-32 test vector 1
it("matches BIP-32 test vector 1", async () => {
  const seed = hexToBytes("0x000102030405060708090a0b0c0d0e0f");
  const node = await fromSeed(seed);
  const child = await derive(node, "m/0'/1/2'/2/1000000000");
  expect(bytesToHex(getPublicKey(child))).toBe("0x...");
});

// Invalid path
it("rejects invalid derivation path", async () => {
  const exit = await Effect.runPromiseExit(derive(node, "invalid"));
  expect(Exit.isFailure(exit)).toBe(true);
});
```

---

## Cross-Cutting Issues

### 1. Assertion Quality
Most tests use loose assertions like:
```typescript
expect(result.length).toBe(32);
expect(result[0]).toBe(0xe3);
```

Should use exact comparisons:
```typescript
expect(bytesToHex(result)).toBe("0xe3b0c442...");
```

### 2. Error Type Assertions
Tests only check `Exit.isFailure(exit)` without verifying error types:
```typescript
// Current
expect(Exit.isFailure(exit)).toBe(true);

// Should be
expect(Exit.isFailure(exit)).toBe(true);
if (Exit.isFailure(exit)) {
  expect(exit.cause._tag).toBe("Fail");
  expect(exit.cause.error._tag).toBe("InvalidPrivateKey");
}
```

### 3. Missing Test Layer Coverage
- Secp256k1Test: Not tested
- Bls12381Test: Not implemented
- AesGcmTest: Incomplete

### 4. Non-Deterministic Tests
BLS tests use random keys, making failures hard to reproduce.

---

## Priority Fixes

1. **P0 - Security**: Add AesGcm decryption failure tests
2. **P0 - Correctness**: Add NIST/RFC test vectors to SHA256, AesGcm
3. **P1 - Reliability**: Replace random keys with fixed test keys in BLS
4. **P1 - Coverage**: Add HDWalletLive tests
5. **P2 - Quality**: Upgrade assertions to exact hex comparisons
6. **P2 - Quality**: Add error type assertions

---

## Action Items

- [ ] Add Wycheproof vectors to Secp256k1 tests
- [ ] Add RFC 8032 vectors to Ed25519 tests  
- [ ] Add EIP-2537 vectors to BLS tests
- [ ] Add full hex comparison to SHA256 tests
- [ ] Add NIST GCM vectors to AesGcm tests
- [ ] Add decryption failure tests to AesGcm
- [ ] Add BIP-39 seed verification to Bip39 tests
- [ ] Add BIP-32 vectors to HDWallet tests
- [ ] Add HDWalletLive tests
- [ ] Create Bls12381Test mock layer
- [ ] Fix non-deterministic BLS tests
