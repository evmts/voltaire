# EIP-712 Typed Data Signing Review

**Date**: 2026-01-25  
**Scope**: voltaire-effect EIP-712 integration (crypto/EIP712, primitives/TypedData, Domain, DomainSeparator, Permit)  
**Status**: ✅ PASS with recommendations

---

## Executive Summary

The EIP-712 implementation is **well-designed and EIP-712 compliant**. The core implementation in `@tevm/voltaire` properly handles struct hashing, domain separation, type encoding order, nested structs, and array types. The Effect wrapper layer in `voltaire-effect` provides clean service abstractions with proper Layer patterns.

**Key Strengths**:
- Correct `\x19\x01` prefix handling
- Proper alphabetical ordering of dependent types
- Comprehensive value encoding for all Solidity types
- Good domain field validation
- Strong test coverage (1500+ lines of tests)

**Areas for Improvement**:
- No known test vectors from EIP-712 spec
- TypedData schema doesn't require EIP712Domain in voltaire-effect (inconsistent with core)
- Missing Permit2 full batch/witness type support in Effect layer
- No EIP-5267 (eip712Domain()) integration tests

---

## Detailed Analysis

### 1. EIP-712 Compliance: Proper Struct Hashing ✅

**Location**: [hashTypedData.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/hashTypedData.js)

The implementation correctly follows EIP-712:

```javascript
// Correct: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
const data = new Uint8Array(2 + 32 + 32);
data[0] = 0x19;
data[1] = 0x01;
data.set(domainSeparator, 2);
data.set(messageHash, 34);
return keccak256(data);
```

**hashStruct** correctly computes `keccak256(typeHash ‖ encodeData(data))`:
- [hashStruct.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/hashStruct.js#L25-L31)
- [encodeData.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/encodeData.js#L30-L71)

### 2. Domain Separator Calculation ✅

**Location**: [Domain/hash.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/Domain/hash.js)

Correct implementation:
- Only includes fields present in domain (per spec)
- Properly validates all field types
- Uses `hashStruct("EIP712Domain", domain, domainTypes)`

Domain field types correctly defined:
```javascript
const DOMAIN_FIELD_TYPES = {
  name: { name: "name", type: "string" },
  version: { name: "version", type: "string" },
  chainId: { name: "chainId", type: "uint256" },
  verifyingContract: { name: "verifyingContract", type: "address" },
  salt: { name: "salt", type: "bytes32" },
};
```

**Strong validation** (rejects unknown fields, wrong types, wrong lengths).

### 3. Type Encoding Order ✅

**Location**: [encodeType.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/encodeType.js#L48-L58)

Critical EIP-712 requirement met: Referenced types sorted alphabetically:

```javascript
// Line 48-52: Recursively encode referenced custom types (in alphabetical order)
const referencedTypes = typeProps
  .map((p) => p.type)
  .filter((t) => types[t] !== undefined)
  .sort();  // ← Correct alphabetical sort
```

Test confirms this works for nested Mail/Person example.

### 4. Nested Struct Support ✅

**Location**: [encodeValue.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/encodeValue.js#L185-L189)

Custom struct types properly hash recursively:

```javascript
// Custom struct type (hash the struct)
if (types[type]) {
  const obj = value;
  const hash = hashStruct(type, obj, types);
  return hash;
}
```

**Tests confirm** deeply nested (3+ levels) and multiple nested types work:
- [EIP712.test.ts L599-627](file:///Users/williamcory/voltaire/src/crypto/EIP712/EIP712.test.ts#L599-L627) - Mail with Person
- [EIP712.test.ts L1424-1441](file:///Users/williamcory/voltaire/src/crypto/EIP712/EIP712.test.ts#L1424-L1441) - Level1→Level2→Level3

### 5. Array Type Support ✅

**Location**: [encodeValue.js](file:///Users/williamcory/voltaire/src/crypto/EIP712/encodeValue.js#L31-L54)

Both dynamic and fixed-size arrays supported:

```javascript
// Handle both dynamic arrays (uint256[]) and fixed-size arrays (uint256[3])
const arrayMatch = type.match(/^(.+)\[(\d*)\]$/);
if (arrayMatch) {
  // Concatenate all encoded elements and hash
  const hash = keccak256(concatenated);
  return hash;
}
```

**Tests verify**:
- `uint256[]` and `uint256[3]` produce same encoding (per spec)
- `bytes32[10]` fixed arrays
- Empty arrays

### 6. Permit2 Compatibility ⚠️ PARTIAL

**Core voltaire**: Has Zig implementation of Permit2 types:
- `PermitDetails`, `PermitSingle`, `PermitBatch` in [Permit.zig](file:///Users/williamcory/voltaire/src/primitives/Permit/Permit.zig)

**voltaire-effect**: Only has basic ERC-2612 Permit schema:
- [Permit/Struct.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Permit/Struct.ts) - Only covers simple Permit

**Missing**: Effect schemas for:
- `PermitSingle` (Permit2 single-token)
- `PermitBatch` (Permit2 multi-token)
- `PermitBatchWitnessTransferFrom` (with witness data)
- `TokenPermissions` type

### 7. Test Coverage With Known Signatures ⚠️ INCOMPLETE

**Current coverage**:
- 1500+ lines of tests
- Round-trip sign/verify tests
- Edge cases (empty arrays, max uint256, deep nesting)
- ERC-2612 Permit structure
- MetaTransaction structure

**Missing**:
- **No known test vectors from EIP-712 spec** - Should include the exact "Ether Mail" example with expected hash values
- No cross-validation against ethers.js/viem known outputs
- No hardcoded expected domain separator hashes

---

## voltaire-effect Layer Review

### EIP712Service ✅ GOOD

**Location**: [EIP712Service.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/EIP712/EIP712Service.ts)

Clean Effect service pattern:
- `EIP712Service` Context.Tag with proper shape interface
- `EIP712Live` Layer for production
- `EIP712Test` Layer for mocking
- Convenience functions with service dependencies

### TypedData Schema ⚠️ INCONSISTENCY

**Location**: [TypedData/Struct.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/TypedData/Struct.ts)

**Issue**: Input schema doesn't require `EIP712Domain` in types:
```typescript
const TypedDataInputSchema = S.Struct({
  types: S.Record({ key: S.String, value: S.Array(TypedDataFieldInputSchema) }),
  // ...
});
```

But the core `TypedData.from()` **does** require it:
```javascript
// from.js L55-58
if (!typedData.types.EIP712Domain) {
  throw "TypedData types must include EIP712Domain";
}
```

This inconsistency means invalid data could pass Schema validation but fail at runtime.

### Domain Schema ✅ GOOD

**Location**: [Domain/Struct.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Domain/Struct.ts)

- Proper transform to `Domain.from()`
- Re-exports pure functions (`toHash`, `encodeType`, `getEIP712DomainType`)
- ERC-5267 support via `toErc5267Response`

### DomainSeparator Schema ✅ GOOD

**Location**: [DomainSeparator/Hex.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/DomainSeparator/Hex.ts)

- Hex and Bytes schemas
- Proper 32-byte validation
- `equals` comparison function

### Permit Schema ⚠️ LIMITED

**Location**: [Permit/Struct.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Permit/Struct.ts)

Only covers basic ERC-2612:
```typescript
export const Struct = S.Struct({
  owner: S.Uint8ArrayFromSelf,
  spender: S.Uint8ArrayFromSelf,
  value: S.BigIntFromSelf,
  nonce: S.BigIntFromSelf,
  deadline: S.BigIntFromSelf,
});
```

Missing Permit2 structures.

---

## Security Considerations

### ✅ Strengths

1. **Domain validation rejects unknown fields** - Prevents domain pollution attacks
2. **Type bounds checking** - uint8/int8 etc. validated before encoding
3. **Fixed bytes length validation** - bytes4 must be exactly 4 bytes
4. **Address length validation** - verifyingContract must be 20 bytes

### ⚠️ Considerations

1. **No signature malleability protection** - Low s-value enforcement should be in Secp256k1 layer
2. **Recovery bit conversion** - `v - 27` conversion is correct but relies on v being 27/28

---

## Recommendations

### P0: Critical (None)

Implementation is correct and compliant.

### P1: High Priority

#### 1. Add EIP-712 Known Test Vectors

Add the exact "Ether Mail" example from EIP-712 spec with hardcoded expected hashes:

```typescript
// Expected domain separator for the example domain
const expectedDomainSeparator = "0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f";
```

#### 2. Fix TypedData Schema Validation

Add EIP712Domain requirement to input schema:

```typescript
const TypedDataInputSchema = S.Struct({
  types: S.Struct({
    EIP712Domain: S.Array(TypedDataFieldInputSchema),
  }).pipe(S.extend(S.Record({ key: S.String, value: S.Array(TypedDataFieldInputSchema) }))),
  // ...
});
```

### P2: Medium Priority

#### 3. Add Permit2 Schemas

Create Effect schemas for Permit2 types:

```typescript
// primitives/Permit2/PermitSingle.ts
export const PermitSingleStruct = S.Struct({
  details: S.Struct({
    token: S.Uint8ArrayFromSelf,
    amount: S.BigIntFromSelf,
    expiration: S.BigIntFromSelf,
    nonce: S.BigIntFromSelf,
  }),
  spender: S.Uint8ArrayFromSelf,
  sigDeadline: S.BigIntFromSelf,
});
```

#### 4. Add ERC-5267 Integration Test

Test `Domain.toErc5267Response()` integration with actual contract calls.

### P3: Low Priority

#### 5. Cross-Validate Against Other Libraries

Add tests that compare output with ethers.js `_TypedDataEncoder`:

```typescript
import { _TypedDataEncoder } from "ethers";
// Compare hashTypedData output with ethers
```

#### 6. Document Domain Field Order

The current implementation doesn't enforce field order (per spec, order doesn't matter), but documenting this would help users.

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `voltaire-effect/src/crypto/EIP712/EIP712Service.ts` | ✅ | Clean service pattern |
| `voltaire-effect/src/crypto/EIP712/operations.ts` | ✅ | Good convenience wrappers |
| `voltaire-effect/src/crypto/EIP712/index.ts` | ✅ | Proper exports |
| `voltaire-effect/src/crypto/EIP712/EIP712.test.ts` | ✅ | Comprehensive |
| `voltaire-effect/src/primitives/TypedData/Struct.ts` | ⚠️ | Missing EIP712Domain validation |
| `voltaire-effect/src/primitives/TypedData/TypedData.test.ts` | ✅ | Basic coverage |
| `voltaire-effect/src/primitives/Domain/Struct.ts` | ✅ | Good implementation |
| `voltaire-effect/src/primitives/Domain/Domain.test.ts` | ✅ | Good coverage |
| `voltaire-effect/src/primitives/DomainSeparator/Hex.ts` | ✅ | Correct |
| `voltaire-effect/src/primitives/Permit/Struct.ts` | ⚠️ | Missing Permit2 |
| `src/crypto/EIP712/EIP712.js` | ✅ | Well-structured factory pattern |
| `src/crypto/EIP712/hashTypedData.js` | ✅ | Correct prefix |
| `src/crypto/EIP712/encodeType.js` | ✅ | Correct alphabetical order |
| `src/crypto/EIP712/encodeValue.js` | ✅ | All types covered |
| `src/crypto/EIP712/encodeData.js` | ✅ | Correct struct encoding |
| `src/crypto/EIP712/Domain/hash.js` | ✅ | Proper domain hashing |
| `src/crypto/EIP712/EIP712.test.ts` | ✅ | Excellent coverage |

---

## Conclusion

The EIP-712 implementation is **production-ready** with strong compliance to the specification. The Effect wrapper layer provides idiomatic service patterns. The main gaps are:

1. Missing known test vectors for verification
2. TypedData schema inconsistency with core validation
3. Incomplete Permit2 support in Effect layer

These are not blocking issues but should be addressed before wider adoption.
