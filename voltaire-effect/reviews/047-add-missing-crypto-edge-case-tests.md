# Add Missing Crypto Edge Case Tests

## Problem

Crypto modules lack tests for important edge cases like empty inputs, max values, and invalid keys.

**Locations**:
- `src/crypto/Ed25519/Ed25519.test.ts` - missing empty message test
- `src/crypto/Secp256k1/Secp256k1.test.ts` - missing max private key test
- `src/crypto/SHA256/SHA256.test.ts` - limited edge cases
- `src/crypto/Bls12381/Bls12381.test.ts` - missing invalid point tests

## Why This Matters

- Edge cases often reveal bugs
- Security-critical code needs comprehensive testing
- Empty input handling is a common source of vulnerabilities

## Solution

Add the following tests:

### Ed25519 - Empty Message
```typescript
it("signs empty message", async () => {
  const { secretKey } = await generateKeyPair();
  const emptyMessage = new Uint8Array(0);
  const sig = await Effect.runPromise(
    Ed25519.sign(emptyMessage, secretKey).pipe(Effect.provide(Ed25519Live))
  );
  expect(sig.length).toBe(64);
  
  const { publicKey } = await getPublicKey(secretKey);
  const valid = await Effect.runPromise(
    Ed25519.verify(sig, emptyMessage, publicKey).pipe(Effect.provide(Ed25519Live))
  );
  expect(valid).toBe(true);
});
```

### Secp256k1 - Max Valid Private Key
```typescript
it("signs with max valid private key (n-1)", async () => {
  // secp256k1 n-1
  const maxKey = new Uint8Array([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
    0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
    0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
  ]);
  const hash = new Uint8Array(32).fill(0xab);
  const sig = await Effect.runPromise(
    Secp256k1.sign(hash, maxKey).pipe(Effect.provide(Secp256k1Live))
  );
  expect(sig).toBeDefined();
});

it("rejects private key >= n", async () => {
  // secp256k1 n (curve order - invalid)
  const nKey = new Uint8Array([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
    0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
    0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
  ]);
  const hash = new Uint8Array(32).fill(0xab);
  await expect(
    Effect.runPromise(Secp256k1.sign(hash, nKey).pipe(Effect.provide(Secp256k1Live)))
  ).rejects.toThrow();
});
```

### BLS12-381 - Invalid Points
```typescript
it("rejects invalid G1 point", async () => {
  const invalidSig = new Uint8Array(48).fill(0xff);  // Not on curve
  const message = new Uint8Array([1, 2, 3]);
  const pubkey = /* valid pubkey */;
  
  await expect(
    Effect.runPromise(Bls12381.verify(invalidSig, message, pubkey).pipe(Effect.provide(Bls12381Live)))
  ).rejects.toThrow();
});

it("aggregates single signature", async () => {
  const sig = /* single valid signature */;
  const aggregated = await Effect.runPromise(
    Bls12381.aggregate([sig]).pipe(Effect.provide(Bls12381Live))
  );
  // Single signature aggregation should return the same signature
  expect(aggregated).toEqual(sig);
});
```

## Acceptance Criteria

- [ ] Add empty message signing test for Ed25519
- [ ] Add max private key test for Secp256k1
- [ ] Add invalid key (>= n) rejection test
- [ ] Add invalid point test for BLS12-381
- [ ] Add single signature aggregation test
- [ ] All tests pass

## Priority

**Medium** - Test coverage
