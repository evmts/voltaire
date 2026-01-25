# Add Missing Bn254 and KZG Tests

<issue>
<metadata>
priority: P2
severity: medium
category: test-coverage
files: [
  voltaire-effect/src/crypto/Bn254/Bn254.test.ts,
  voltaire-effect/src/crypto/KZG/KZG.test.ts
]
reviews: [087-bn254-kzg-review.md, 090-crypto-test-quality-review.md]
</metadata>

<problem>
Bn254 and KZG test suites lack tests for error conditions and edge cases.

**Bn254 test gaps**:
- No invalid point tests (points not on curve)
- No subgroup check tests
- No scalar boundary tests (0, max field element)
- No pairing malleability tests

**KZG test gaps**:
- Only tests mock layer, no live tests
- No trusted setup error tests
- No wrong blob size tests
- No commitment verification tests
- No proof verification tests

**Why this matters**:
- Error handling paths untested - bugs hide in catch blocks
- Invalid input behavior unknown - security vulnerabilities
- Mock layer tests don't verify real cryptographic implementation
- EIP-4844 compliance requires proper blob/commitment validation
</problem>

<solution>
Add comprehensive tests for both Bn254 and KZG covering:
1. **Error conditions** - Invalid inputs, boundary values
2. **Edge cases** - Zero values, max values, empty inputs
3. **Live implementation tests** - Real crypto operations (conditional on setup)
4. **Verification tests** - End-to-end proof creation and verification
</solution>

<implementation>
<steps>
1. Add invalid point tests for Bn254
2. Add subgroup check tests for Bn254
3. Add scalar boundary tests (0, field modulus-1, field modulus)
4. Add conditional live KZG tests (skip if no trusted setup)
5. Add KZG commitment/proof verification tests
6. Add blob size validation tests
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/Bn254/Bn254.test.ts - ADD:

describe("Bn254 error handling", () => {
  // BN254 field modulus p
  const BN254_P = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  
  // BN254 curve order r (subgroup order)
  const BN254_R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

  // G1 generator
  const G1_GEN = { x: 1n, y: 2n };

  describe("invalid points", () => {
    it("rejects point not on curve", async () => {
      const invalidPoint = { x: 1n, y: 3n };  // (1, 3) is not on y² = x³ + 3

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(invalidPoint, 5n);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("rejects coordinates outside field", async () => {
      const outOfField = { x: BN254_P, y: 2n };  // x = p is out of field

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.add(G1_GEN, outOfField);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("rejects negative coordinates", async () => {
      const negative = { x: -1n, y: 2n };

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(negative, 5n);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("subgroup checks", () => {
    it("isInSubgroupG1 returns true for generator", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.isInSubgroupG1(G1_GEN);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result).toBe(true);
    });

    it("isOnCurveG1 returns true for generator", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.isOnCurveG1(G1_GEN);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result).toBe(true);
    });

    it("isOnCurveG1 returns false for invalid point", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.isOnCurveG1({ x: 1n, y: 3n });
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result).toBe(false);
    });
  });

  describe("scalar boundary values", () => {
    it("handles scalar = 0 (returns point at infinity)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(G1_GEN, 0n);
        }).pipe(Effect.provide(Bn254Live))
      );

      // Point at infinity check
      expect(result.z === 0n || (result.x === 0n && result.y === 0n)).toBe(true);
    });

    it("handles scalar = 1 (identity)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(G1_GEN, 1n);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result.x).toBe(G1_GEN.x);
      expect(result.y).toBe(G1_GEN.y);
    });

    it("handles scalar = r (curve order) returns point at infinity", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(G1_GEN, BN254_R);
        }).pipe(Effect.provide(Bn254Live))
      );

      // r * G = O (point at infinity)
      expect(result.z === 0n || (result.x === 0n && result.y === 0n)).toBe(true);
    });

    it("handles scalar = r-1", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          const point = yield* bn.mul(G1_GEN, BN254_R - 1n);
          // (r-1) * G = -G
          return point;
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result.x).toBe(G1_GEN.x);
      // y should be negated: p - y
      expect(result.y).toBe(BN254_P - G1_GEN.y);
    });
  });

  describe("point arithmetic properties", () => {
    it("add is commutative: P + Q = Q + P", async () => {
      const [result1, result2] = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          const P = G1_GEN;
          const Q = yield* bn.mul(G1_GEN, 2n);
          
          const pq = yield* bn.add(P, Q);
          const qp = yield* bn.add(Q, P);
          return [pq, qp];
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result1.x).toBe(result2.x);
      expect(result1.y).toBe(result2.y);
    });

    it("add identity: P + O = P", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          const O = yield* bn.mul(G1_GEN, 0n);  // Point at infinity
          return yield* bn.add(G1_GEN, O);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result.x).toBe(G1_GEN.x);
      expect(result.y).toBe(G1_GEN.y);
    });

    it("mul distributive: (a + b) * P = a*P + b*P", async () => {
      const a = 5n;
      const b = 7n;

      const [left, right] = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          
          // (a + b) * P
          const lhs = yield* bn.mul(G1_GEN, a + b);
          
          // a*P + b*P
          const aP = yield* bn.mul(G1_GEN, a);
          const bP = yield* bn.mul(G1_GEN, b);
          const rhs = yield* bn.add(aP, bP);
          
          return [lhs, rhs];
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(left.x).toBe(right.x);
      expect(left.y).toBe(right.y);
    });
  });
});

// voltaire-effect/src/crypto/KZG/KZG.test.ts - ADD:

describe("KZG error handling", () => {
  // EIP-4844 blob size: 4096 * 32 = 131072 bytes
  const BLOB_SIZE = 131072;
  
  // Check if trusted setup is available
  const hasTrustedSetup = process.env.KZG_TRUSTED_SETUP !== undefined;
  
  // Conditional test runner
  const itLive = hasTrustedSetup ? it : it.skip;

  describe("blob size validation", () => {
    itLive("rejects undersized blob", async () => {
      const wrongSize = new Uint8Array(1000);  // Not 128KB
      
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(wrongSize);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(Exit.isFailure(result)).toBe(true);
    });

    itLive("rejects oversized blob", async () => {
      const wrongSize = new Uint8Array(BLOB_SIZE + 1);
      
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(wrongSize);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(Exit.isFailure(result)).toBe(true);
    });

    itLive("accepts exactly correct size blob", async () => {
      const correctSize = new Uint8Array(BLOB_SIZE).fill(0);
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(correctSize);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result.length).toBe(48);  // G1 point compressed
    });
  });

  describe("without trusted setup", () => {
    it("fails gracefully when setup not loaded", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(new Uint8Array(BLOB_SIZE));
        }).pipe(Effect.provide(KZGUninitialized))
      );
      
      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("commitment operations", () => {
    itLive("commits to zero blob", async () => {
      const zeroBlob = new Uint8Array(BLOB_SIZE);  // All zeros
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(zeroBlob);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result.length).toBe(48);
    });

    itLive("commits to non-zero blob", async () => {
      const blob = new Uint8Array(BLOB_SIZE);
      for (let i = 0; i < BLOB_SIZE; i++) {
        blob[i] = i % 256;
      }
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          return yield* kzg.commit(blob);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result.length).toBe(48);
    });

    itLive("same blob produces same commitment", async () => {
      const blob = new Uint8Array(BLOB_SIZE).fill(0xab);
      
      const [c1, c2] = await Effect.runPromise(
        Effect.all([
          Effect.gen(function* () {
            const kzg = yield* KZGService;
            return yield* kzg.commit(blob);
          }),
          Effect.gen(function* () {
            const kzg = yield* KZGService;
            return yield* kzg.commit(blob);
          }),
        ]).pipe(Effect.provide(KZGLive))
      );
      
      expect(c1).toEqual(c2);
    });

    itLive("different blobs produce different commitments", async () => {
      const blob1 = new Uint8Array(BLOB_SIZE).fill(0xaa);
      const blob2 = new Uint8Array(BLOB_SIZE).fill(0xbb);
      
      const [c1, c2] = await Effect.runPromise(
        Effect.all([
          Effect.gen(function* () {
            const kzg = yield* KZGService;
            return yield* kzg.commit(blob1);
          }),
          Effect.gen(function* () {
            const kzg = yield* KZGService;
            return yield* kzg.commit(blob2);
          }),
        ]).pipe(Effect.provide(KZGLive))
      );
      
      expect(c1).not.toEqual(c2);
    });
  });

  describe("proof generation and verification", () => {
    itLive("generates valid proof for blob", async () => {
      const blob = new Uint8Array(BLOB_SIZE).fill(0x42);
      const z = new Uint8Array(32);  // Evaluation point
      z[31] = 1;  // z = 1
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          const commitment = yield* kzg.commit(blob);
          const { proof, y } = yield* kzg.computeProof(blob, z);
          
          return { commitment, proof, y };
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result.proof.length).toBe(48);
      expect(result.y.length).toBe(32);
    });

    itLive("verifies valid proof", async () => {
      const blob = new Uint8Array(BLOB_SIZE).fill(0x42);
      const z = new Uint8Array(32);
      z[31] = 1;
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          const commitment = yield* kzg.commit(blob);
          const { proof, y } = yield* kzg.computeProof(blob, z);
          
          return yield* kzg.verifyProof(commitment, z, y, proof);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result).toBe(true);
    });

    itLive("rejects invalid proof", async () => {
      const blob = new Uint8Array(BLOB_SIZE).fill(0x42);
      const z = new Uint8Array(32);
      z[31] = 1;
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          const commitment = yield* kzg.commit(blob);
          const { proof, y } = yield* kzg.computeProof(blob, z);
          
          // Corrupt the proof
          const corruptedProof = new Uint8Array(proof);
          corruptedProof[0] ^= 0xff;
          
          return yield* kzg.verifyProof(commitment, z, y, corruptedProof);
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(result).toBe(false);
    });
  });

  describe("blob to commitment (EIP-4844)", () => {
    itLive("blobToKzgCommitment matches commit", async () => {
      const blob = new Uint8Array(BLOB_SIZE).fill(0x12);
      
      const [c1, c2] = await Effect.runPromise(
        Effect.gen(function* () {
          const kzg = yield* KZGService;
          const commitment1 = yield* kzg.commit(blob);
          const commitment2 = yield* kzg.blobToKzgCommitment(blob);
          return [commitment1, commitment2];
        }).pipe(Effect.provide(KZGLive))
      );
      
      expect(c1).toEqual(c2);
    });
  });
});

describe("KZG with mock layer", () => {
  it("mock layer returns deterministic values", async () => {
    const blob = new Uint8Array(131072).fill(0x42);
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const kzg = yield* KZGService;
        return yield* kzg.commit(blob);
      }).pipe(Effect.provide(KZGTest))
    );
    
    // Mock should return consistent deterministic value
    expect(result.length).toBe(48);
  });
});
```
</code_changes>
</implementation>

<tests>
The implementation section contains the complete test code. Key patterns:

1. **Conditional tests** - Use `hasTrustedSetup` flag to skip live tests when setup unavailable
2. **Boundary testing** - Test 0, 1, field modulus values
3. **Property testing** - Verify mathematical properties (commutativity, distributivity)
4. **End-to-end verification** - Complete proof generation and verification cycles
</tests>

<api>
<before>
```typescript
// Minimal test coverage
describe("Bn254", () => {
  it("basic add works", async () => {
    // Single happy-path test
  });
});

describe("KZG", () => {
  it("mock layer works", async () => {
    // Only tests mock, not live implementation
  });
});
```
</before>

<after>
```typescript
// Comprehensive coverage
describe("Bn254 error handling", () => {
  // Invalid point tests
  // Subgroup checks
  // Scalar boundary tests
  // Mathematical property tests
});

describe("KZG error handling", () => {
  // Blob size validation
  // Trusted setup errors
  // Commitment operations
  // Proof generation/verification
});
```
</after>

<breaking>
None - these are additive test cases only.
</breaking>
</api>

<references>
- [EIP-4844 (Proto-Danksharding)](https://eips.ethereum.org/EIPS/eip-4844)
- [BN254 curve parameters](https://hackmd.io/@jpw/bn254)
- [c-kzg-4844 library](https://github.com/ethereum/c-kzg-4844)
- [Review 087: Bn254 KZG](./087-bn254-kzg-review.md)
- [Review 090: Crypto Test Quality](./090-crypto-test-quality-review.md)
</references>
</issue>
