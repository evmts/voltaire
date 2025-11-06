# Create Unified Signature Abstraction

**Priority: MEDIUM**

No unified Signature type across algorithms.

## Task
Create unified Signature primitive with algorithm-agnostic interface.

## Current State
Scattered implementations:
- `src/crypto/secp256k1/BrandedSignature.ts`
- `src/crypto/p256/BrandedP256Signature.ts`
- `src/crypto/ed25519/Signature.ts`

## Proposed Structure
```
src/primitives/Signature/
├── BrandedSignature.ts       # Base type
├── from.ts                    # Constructor
├── fromSecp256k1.ts          # Algorithm-specific constructors
├── fromP256.ts
├── fromEd25519.ts
├── toBytes.ts
├── toCompact.ts              # Compact encoding
├── fromCompact.ts
├── toDER.ts                  # DER encoding
├── fromDER.ts
├── normalize.ts              # Normalize s-value
├── isCanonical.ts            # Check canonical form
├── verify.ts                 # Verify with public key
├── getAlgorithm.ts           # Get signature algorithm
└── index.ts
```

## Features
- Algorithm tagging (secp256k1, p256, ed25519)
- Format conversions (compact, DER, raw)
- Validation (canonical s-value)
- Cross-algorithm compatibility checks

## Verification
```bash
bun run test -- Signature
```
