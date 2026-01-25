# Add Missing Crypto Edge Case Tests

<issue>
<metadata>
priority: P2
severity: medium
category: test-coverage
files: [
  voltaire-effect/src/crypto/Ed25519/Ed25519.test.ts,
  voltaire-effect/src/crypto/Secp256k1/Secp256k1.test.ts,
  voltaire-effect/src/crypto/Bls12381/Bls12381.test.ts,
  voltaire-effect/src/crypto/SHA256/SHA256.test.ts
]
reviews: [090-crypto-test-quality-review.md]
</metadata>

<problem>
Crypto modules lack tests for important edge cases like empty inputs, max values, and invalid keys.

**Missing test coverage**:
1. **Ed25519**: No empty message signing test
2. **Secp256k1**: No max private key (n-1) test, no key >= n rejection test
3. **BLS12-381**: No invalid point tests, no single signature aggregation test
4. **SHA256**: Limited edge cases (empty input, very large input)

**Why this matters**:
- Edge cases often reveal bugs in cryptographic implementations
- Security-critical code needs comprehensive testing
- Empty input handling is a common source of vulnerabilities
- Boundary values (max valid, min invalid) are prone to off-by-one errors
</problem>

<solution>
Add comprehensive edge case tests for all crypto modules following these categories:
1. **Empty/zero inputs** - Empty messages, zero keys, null values
2. **Boundary values** - Max valid, min invalid, exact boundaries
3. **Invalid inputs** - Wrong lengths, invalid formats, points not on curve
4. **Single-element operations** - Single signature aggregation, single-key operations
</solution>

<implementation>
<steps>
1. Add empty message tests to Ed25519
2. Add boundary value tests to Secp256k1 (n-1, n, n+1 keys)
3. Add invalid point tests to BLS12-381
4. Add empty/large input tests to SHA256
5. Add single-element aggregation tests
6. Ensure all tests use Effect patterns
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/Ed25519/Ed25519.test.ts - ADD:

describe("Ed25519 edge cases", () => {
  it("signs empty message", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const ed = yield* Ed25519Service;
        const { secretKey, publicKey } = yield* ed.generateKeyPair?.() ?? 
          Effect.succeed({ 
            secretKey: new Uint8Array(32).fill(0x42), 
            publicKey: new Uint8Array(32) 
          });
        
        const emptyMessage = new Uint8Array(0);
        const sig = yield* ed.sign(emptyMessage, secretKey);
        
        expect(sig.length).toBe(64);
        
        // Verify the empty message signature
        const derivedPubKey = yield* ed.getPublicKey(secretKey);
        const valid = yield* ed.verify(sig, emptyMessage, derivedPubKey);
        return valid;
      }).pipe(Effect.provide(Ed25519Live))
    );
    
    expect(result).toBe(true);
  });

  it("signs single-byte message", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const ed = yield* Ed25519Service;
        const secretKey = new Uint8Array(32).fill(0x42);
        
        const singleByte = new Uint8Array([0xff]);
        const sig = yield* ed.sign(singleByte, secretKey);
        
        expect(sig.length).toBe(64);
        return sig;
      }).pipe(Effect.provide(Ed25519Live))
    );
    
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("signs maximum length message (1MB)", async () => {
    const largeMessage = new Uint8Array(1024 * 1024).fill(0xab);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const ed = yield* Ed25519Service;
        const secretKey = new Uint8Array(32).fill(0x42);
        return yield* ed.sign(largeMessage, secretKey);
      }).pipe(Effect.provide(Ed25519Live))
    );
    
    expect(result.length).toBe(64);
  });

  it("rejects wrong-length secret key", async () => {
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const ed = yield* Ed25519Service;
        const wrongSize = new Uint8Array(31);  // Should be 32
        return yield* ed.getPublicKey(wrongSize);
      }).pipe(Effect.provide(Ed25519Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });
});

// voltaire-effect/src/crypto/Secp256k1/Secp256k1.test.ts - ADD:

describe("Secp256k1 boundary values", () => {
  // secp256k1 curve order n
  const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  
  const bigintToBytes32 = (n: bigint): Uint8Array => {
    const hex = n.toString(16).padStart(64, "0");
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  };

  it("signs with max valid private key (n-1)", async () => {
    const maxValidKey = bigintToBytes32(CURVE_ORDER - 1n);
    const hash = new Uint8Array(32).fill(0xab);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(hash, maxValidKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(result).toBeDefined();
    expect(result.r.length).toBe(32);
    expect(result.s.length).toBe(32);
  });

  it("rejects private key equal to curve order (n)", async () => {
    const curveOrderKey = bigintToBytes32(CURVE_ORDER);
    const hash = new Uint8Array(32).fill(0xab);
    
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(hash, curveOrderKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("rejects private key greater than curve order (n+1)", async () => {
    const oversizedKey = bigintToBytes32(CURVE_ORDER + 1n);
    const hash = new Uint8Array(32).fill(0xab);
    
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(hash, oversizedKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("rejects zero private key", async () => {
    const zeroKey = new Uint8Array(32);  // All zeros
    const hash = new Uint8Array(32).fill(0xab);
    
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(hash, zeroKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("accepts minimum valid private key (1)", async () => {
    const minValidKey = bigintToBytes32(1n);
    const hash = new Uint8Array(32).fill(0xab);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(hash, minValidKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(result).toBeDefined();
  });

  it("handles hash with leading zeros", async () => {
    const leadingZeroHash = new Uint8Array(32);
    leadingZeroHash[31] = 0x01;  // Only last byte is non-zero
    
    const privateKey = bigintToBytes32(42n);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(leadingZeroHash, privateKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(result).toBeDefined();
  });

  it("handles all-ones hash (0xff...ff)", async () => {
    const allOnesHash = new Uint8Array(32).fill(0xff);
    const privateKey = bigintToBytes32(42n);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const secp = yield* Secp256k1Service;
        return yield* secp.sign(allOnesHash, privateKey);
      }).pipe(Effect.provide(Secp256k1Live))
    );
    
    expect(result).toBeDefined();
  });
});

// voltaire-effect/src/crypto/Bls12381/Bls12381.test.ts - ADD:

describe("BLS12-381 edge cases", () => {
  it("rejects invalid G1 point (not on curve)", async () => {
    // Invalid signature: all 0xFF bytes are not a valid G1 point
    const invalidSig = new Uint8Array(48).fill(0xff);
    const message = new Uint8Array([1, 2, 3]);
    const pubkey = new Uint8Array(48).fill(0x01);  // Also invalid but test sig first
    
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const bls = yield* Bls12381Service;
        return yield* bls.verify(invalidSig, message, pubkey);
      }).pipe(Effect.provide(Bls12381Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("aggregates single signature (identity operation)", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bls = yield* Bls12381Service;
        
        // Generate a valid signature
        const privateKey = yield* bls.randomPrivateKey();
        const publicKey = yield* bls.derivePublicKey(privateKey);
        const message = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const sig = yield* bls.sign(message, privateKey);
        
        // Aggregate single signature
        const aggregated = yield* bls.aggregate([sig]);
        
        // Single signature aggregation should be equivalent to original
        // Verify it still works
        const valid = yield* bls.verify(aggregated, message, publicKey);
        return { aggregated, sig, valid };
      }).pipe(Effect.provide(Bls12381Live))
    );
    
    expect(result.valid).toBe(true);
    // Aggregated single sig should equal original
    expect(result.aggregated).toEqual(result.sig);
  });

  it("handles empty message signing", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bls = yield* Bls12381Service;
        
        const privateKey = yield* bls.randomPrivateKey();
        const emptyMessage = new Uint8Array(0);
        return yield* bls.sign(emptyMessage, privateKey);
      }).pipe(Effect.provide(Bls12381Live))
    );
    
    expect(result.length).toBe(96);  // G2 point
  });

  it("rejects aggregating zero signatures", async () => {
    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const bls = yield* Bls12381Service;
        return yield* bls.aggregate([]);
      }).pipe(Effect.provide(Bls12381Live))
    );
    
    expect(Exit.isFailure(result)).toBe(true);
  });

  it("aggregates many signatures (100)", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bls = yield* Bls12381Service;
        
        const sigs = [];
        for (let i = 0; i < 100; i++) {
          const pk = yield* bls.randomPrivateKey();
          const msg = new Uint8Array([i]);
          const sig = yield* bls.sign(msg, pk);
          sigs.push(sig);
        }
        
        return yield* bls.aggregate(sigs);
      }).pipe(Effect.provide(Bls12381Live))
    );
    
    expect(result.length).toBe(96);
  });
});

// voltaire-effect/src/crypto/SHA256/SHA256.test.ts - ADD:

describe("SHA256 edge cases", () => {
  it("hashes empty input", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(new Uint8Array(0));
      }).pipe(Effect.provide(SHA256Live))
    );
    
    // Known SHA-256 of empty string
    const expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(Buffer.from(result).toString("hex")).toBe(expected);
  });

  it("hashes single byte", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(new Uint8Array([0x00]));
      }).pipe(Effect.provide(SHA256Live))
    );
    
    expect(result.length).toBe(32);
  });

  it("hashes exactly 64 bytes (one block)", async () => {
    const oneBlock = new Uint8Array(64).fill(0xab);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(oneBlock);
      }).pipe(Effect.provide(SHA256Live))
    );
    
    expect(result.length).toBe(32);
  });

  it("hashes 63 bytes (block boundary -1)", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(new Uint8Array(63).fill(0xcd));
      }).pipe(Effect.provide(SHA256Live))
    );
    
    expect(result.length).toBe(32);
  });

  it("hashes 65 bytes (block boundary +1)", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(new Uint8Array(65).fill(0xef));
      }).pipe(Effect.provide(SHA256Live))
    );
    
    expect(result.length).toBe(32);
  });

  it("hashes large input (10MB)", async () => {
    const largeInput = new Uint8Array(10 * 1024 * 1024).fill(0x42);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sha = yield* SHA256Service;
        return yield* sha.hash(largeInput);
      }).pipe(Effect.provide(SHA256Live))
    );
    
    expect(result.length).toBe(32);
  });

  it("produces consistent output for same input", async () => {
    const input = new Uint8Array([1, 2, 3, 4, 5]);
    
    const [result1, result2] = await Effect.runPromise(
      Effect.all([
        Effect.gen(function* () {
          const sha = yield* SHA256Service;
          return yield* sha.hash(input);
        }).pipe(Effect.provide(SHA256Live)),
        Effect.gen(function* () {
          const sha = yield* SHA256Service;
          return yield* sha.hash(input);
        }).pipe(Effect.provide(SHA256Live)),
      ])
    );
    
    expect(result1).toEqual(result2);
  });
});
```
</code_changes>
</implementation>

<tests>
The implementation section contains the complete test code. Tests follow these principles:

1. **Effect patterns** - All tests use Effect.gen and proper service access
2. **Exit inspection** - Use `Effect.runPromiseExit` for failure tests
3. **Known vectors** - Where possible, use known test vectors (e.g., SHA256 empty hash)
4. **Boundary testing** - Test exact boundaries (n-1, n, n+1 for curve order)
5. **Independence** - Each test is self-contained
</tests>

<api>
<before>
```typescript
// No edge case tests exist
```
</before>

<after>
```typescript
// Comprehensive edge case coverage:
// - Ed25519: empty message, single byte, 1MB message, wrong key size
// - Secp256k1: n-1, n, n+1 keys, zero key, leading zero hash
// - BLS12-381: invalid points, single sig aggregate, empty message, 100 sigs
// - SHA256: empty, block boundaries (63, 64, 65 bytes), 10MB
```
</after>

<breaking>
None - these are additive test cases only.
</breaking>
</api>

<references>
- [Review 090: Crypto Test Quality](./090-crypto-test-quality-review.md)
- [secp256k1 curve parameters](https://www.secg.org/sec2-v2.pdf)
- [SHA-256 test vectors](https://www.di-mgt.com.au/sha_testvectors.html)
- [BLS12-381 specification](https://electriccoin.co/blog/new-snark-curve/)
</references>
</issue>
