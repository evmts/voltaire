# Review 099: EIP-712 TypedData Signing

<issue>
<metadata>
priority: P2
files: [
  "voltaire-effect/src/crypto/EIP712/EIP712Service.ts",
  "voltaire-effect/src/crypto/EIP712/operations.ts",
  "voltaire-effect/src/crypto/EIP712/EIP712.test.ts",
  "voltaire-effect/src/crypto/EIP712/index.ts",
  "voltaire-effect/src/primitives/TypedData/Struct.ts",
  "voltaire-effect/src/primitives/TypedData/TypedData.test.ts",
  "voltaire-effect/src/primitives/Domain/Struct.ts",
  "voltaire-effect/src/primitives/Domain/Domain.test.ts",
  "voltaire-effect/src/primitives/DomainSeparator/Hex.ts",
  "voltaire-effect/src/primitives/Permit/Struct.ts",
  "src/crypto/EIP712/hashTypedData.js",
  "src/crypto/EIP712/encodeType.js",
  "src/crypto/EIP712/encodeValue.js",
  "src/crypto/EIP712/encodeData.js",
  "src/crypto/EIP712/Domain/hash.js",
  "src/crypto/EIP712/EIP712.test.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
EIP-712 structured data signing implementation. Provides domain-separated typed signatures for Ethereum, used in Permit, ERC-2612, Permit2, meta-transactions, and dApp authentication. Core handles struct hashing, domain separation, type encoding, and nested struct support.
</purpose>
<current_status>
**WELL-DESIGNED AND EIP-712 COMPLIANT** with correct `\x19\x01` prefix, alphabetical type ordering, and comprehensive value encoding. Effect layer provides clean service abstractions. **Minor gaps**: No known test vectors from EIP-712 spec, TypedData schema inconsistency, and missing Permit2 support.
</current_status>
</module_overview>

<findings>
<critical>
None - implementation is EIP-712 compliant.
</critical>
<high>
### 1. TypedData Schema Missing EIP712Domain Requirement (P1)

**Location**: `TypedData/Struct.ts`

The Effect schema doesn't require `EIP712Domain` in types, but core `TypedData.from()` does:

```typescript
// Effect schema (PERMISSIVE):
const TypedDataInputSchema = S.Struct({
  types: S.Record({ key: S.String, value: S.Array(TypedDataFieldInputSchema) }),
  // No requirement for EIP712Domain key
});

// Core validation (STRICT):
if (!typedData.types.EIP712Domain) {
  throw "TypedData types must include EIP712Domain";
}
```

**Impact**: Invalid data passes Schema validation but fails at runtime.

### 2. Missing Known Test Vectors (P1)

**Location**: `EIP712.test.ts`

No tests use the exact "Ether Mail" example from EIP-712 spec with expected hash values. This is the primary way to verify compliance.

```typescript
// Missing: Hardcoded expected values from EIP-712 spec
const expectedDomainSeparator = "0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f";
```

### 3. Permit2 Schemas Missing (P1)

**Location**: `primitives/Permit/Struct.ts`

Only basic ERC-2612 Permit is supported. Missing Permit2 types:

```typescript
// Current - only ERC-2612
export const Struct = S.Struct({
  owner, spender, value, nonce, deadline
});

// Missing - Permit2 types:
// PermitSingle, PermitBatch, TokenPermissions
// PermitBatchWitnessTransferFrom
```

</high>
<medium>
### 4. No EIP-5267 Integration Tests (P2)

**Location**: `Domain/Struct.ts`

`Domain.toErc5267Response()` exists but no tests verify it matches actual contract `eip712Domain()` calls.

### 5. No Cross-Validation Against Other Libraries (P2)

No tests compare output with ethers.js `_TypedDataEncoder` or viem's `hashTypedData` to verify compatibility.

</medium>
</findings>

<effect_improvements>
### Fix TypedData Schema Validation

```typescript
// TypedData/Struct.ts - Require EIP712Domain
const TypedDataInputSchema = S.Struct({
  types: S.Struct({
    EIP712Domain: S.Array(TypedDataFieldInputSchema),  // Required
  }).pipe(
    S.extend(S.Record({ 
      key: S.String, 
      value: S.Array(TypedDataFieldInputSchema) 
    }))
  ),
  primaryType: S.String,
  domain: DomainInputSchema,
  message: S.Record({ key: S.String, value: S.Unknown }),
});
```

### Add Permit2 Schemas

```typescript
// primitives/Permit2/TokenPermissions.ts
export const TokenPermissionsStruct = S.Struct({
  token: Address.Bytes,
  amount: S.BigIntFromSelf,
});

// primitives/Permit2/PermitSingle.ts
export const PermitSingleStruct = S.Struct({
  details: S.Struct({
    token: Address.Bytes,
    amount: S.BigIntFromSelf,
    expiration: S.BigIntFromSelf,
    nonce: S.BigIntFromSelf,
  }),
  spender: Address.Bytes,
  sigDeadline: S.BigIntFromSelf,
});

// primitives/Permit2/PermitBatch.ts
export const PermitBatchStruct = S.Struct({
  details: S.Array(TokenPermissionsStruct),
  spender: Address.Bytes,
  sigDeadline: S.BigIntFromSelf,
});
```

### Add EIP-712 Known Test Vectors

```typescript
// EIP712.test.ts
describe("EIP-712 spec compliance", () => {
  // From EIP-712 specification
  const mailDomain = {
    name: "Ether Mail",
    version: "1",
    chainId: 1n,
    verifyingContract: Address.from("0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"),
  };

  const mailTypes = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  };

  it("produces correct domain separator", () => {
    const separator = Domain.hash(mailDomain);
    expect(Hex.fromBytes(separator)).toBe(
      "0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f"
    );
  });

  it("produces correct Mail type hash", () => {
    const typeHash = encodeType("Mail", mailTypes);
    expect(Hex.fromBytes(keccak256(typeHash))).toBe(
      "0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2"
    );
  });
});
```
</effect_improvements>

<viem_comparison>
**viem EIP-712 Implementation**:
- `hashTypedData()` - main entry point
- `encodeTypedData()` - for signing
- Full Permit2 type support
- Domain separator caching

**voltaire-effect Advantages**:
- Effect service pattern for dependency injection
- EIP712Live/EIP712Test layer separation
- Clean Schema integration

**voltaire-effect Gaps**:
- Missing Permit2 schemas
- No known test vector validation
- TypedData schema too permissive
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Add EIP712Domain requirement to TypedData schema** - Fail fast on invalid input
2. **Add EIP-712 spec test vectors** - "Ether Mail" example with expected hashes
3. **Create Permit2 directory** - PermitSingle, PermitBatch, TokenPermissions
4. **Add cross-library comparison tests** - Compare with ethers.js output
5. **Add EIP-5267 integration test** - Verify against contract calls
6. **Document domain field order** - Clarify that order doesn't matter
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Schema with required nested key
const TypedDataSchema = S.Struct({
  types: S.Struct({
    EIP712Domain: S.Array(TypedDataFieldSchema),  // Always required
  }).pipe(S.extend(S.Record({ key: S.String, value: S.Array(TypedDataFieldSchema) }))),
  primaryType: S.String.pipe(S.filter((t) => t !== "EIP712Domain")),  // Can't sign domain
  domain: DomainSchema,
  message: S.Unknown,
}).pipe(
  S.filter(
    (td) => td.types[td.primaryType] !== undefined,
    { message: () => "primaryType must exist in types" }
  )
);

// Pattern: Typed Permit2 signing
const signPermit2 = (
  permit: PermitSingle,
  domain: Domain,
  signer: SignerService
) => Effect.gen(function* () {
  const eip712 = yield* EIP712Service;
  const hash = yield* eip712.hashTypedData({
    types: PERMIT2_TYPES,
    primaryType: "PermitSingle",
    domain,
    message: permit,
  });
  return yield* signer.signHash(hash);
});
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- EIP-712 spec "Ether Mail" example with exact expected hashes
- Domain separator for various field combinations
- Type encoding alphabetical order verification
- Nested struct (3+ levels) hashing
- Array of structs encoding
- Empty domain (minimal fields)
- Cross-library compatibility (vs ethers/viem)
- Permit2 PermitSingle signing
- Permit2 PermitBatch signing
- EIP-5267 response format
</missing_coverage>
<test_code>
```typescript
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import { TypedDataSchema } from "./TypedData/Struct.js";
import { hashTypedData, encodeType } from "./index.js";

describe("TypedData schema validation", () => {
  it("rejects TypedData without EIP712Domain", () => {
    const invalid = {
      types: {
        Person: [{ name: "name", type: "string" }],
      },
      primaryType: "Person",
      domain: { name: "Test" },
      message: { name: "Alice" },
    };
    expect(() => S.decodeSync(TypedDataSchema)(invalid)).toThrow("EIP712Domain");
  });

  it("accepts valid TypedData with EIP712Domain", () => {
    const valid = {
      types: {
        EIP712Domain: [{ name: "name", type: "string" }],
        Person: [{ name: "name", type: "string" }],
      },
      primaryType: "Person",
      domain: { name: "Test" },
      message: { name: "Alice" },
    };
    expect(() => S.decodeSync(TypedDataSchema)(valid)).not.toThrow();
  });
});

describe("EIP-712 spec compliance", () => {
  const MAIL_DOMAIN = {
    name: "Ether Mail",
    version: "1",
    chainId: 1n,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
  };

  it("encodes Person type correctly", () => {
    const encoded = encodeType("Person", MAIL_TYPES);
    expect(encoded).toBe("Person(string name,address wallet)");
  });

  it("encodes Mail type with dependencies alphabetically", () => {
    const encoded = encodeType("Mail", MAIL_TYPES);
    // Person comes before contents in encoding because it's a dependency
    expect(encoded).toBe(
      "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
    );
  });
});

describe("Permit2 TypedData", () => {
  it("signs PermitSingle correctly", async () => {
    const permit: PermitSingle = {
      details: {
        token: Address.from("0x..."),
        amount: 1000000n,
        expiration: BigInt(Date.now() / 1000 + 3600),
        nonce: 0n,
      },
      spender: Address.from("0x..."),
      sigDeadline: BigInt(Date.now() / 1000 + 3600),
    };
    
    const hash = await Effect.runPromise(
      hashTypedData({
        types: PERMIT2_TYPES,
        primaryType: "PermitSingle",
        domain: PERMIT2_DOMAIN,
        message: permit,
      }).pipe(Effect.provide(EIP712Live))
    );
    
    expect(hash.length).toBe(32);
  });
});
```
</test_code>
</tests>

<docs>
- Add EIP-712 signing guide with examples
- Document domain field requirements
- Add Permit2 integration example
- Document alphabetical type ordering requirement
- Add security notes about signature verification
</docs>

<api>
<changes>
1. `TypedDataSchema` - Add EIP712Domain requirement
2. `Permit2` module - New with PermitSingle, PermitBatch, TokenPermissions
3. `signPermit2()` - New convenience function
4. `verifyPermit2()` - New convenience function
5. Export PERMIT2_TYPES constant
</changes>
</api>

<references>
- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-2612: Permit Extension](https://eips.ethereum.org/EIPS/eip-2612)
- [EIP-5267: Retrieval of EIP-712 domain](https://eips.ethereum.org/EIPS/eip-5267)
- [Permit2 Documentation](https://docs.uniswap.org/contracts/permit2/overview)
- [viem hashTypedData](https://viem.sh/docs/utilities/hashTypedData)
- [Effect Schema docs](https://effect.website/docs/schema)
</references>
</issue>

## EIP-712 Compliance Matrix

| Requirement | Status | Location |
|-------------|--------|----------|
| `\x19\x01` prefix | ✅ | `hashTypedData.js:25-27` |
| Domain separator calculation | ✅ | `Domain/hash.js` |
| Alphabetical type ordering | ✅ | `encodeType.js:48-52` |
| Nested struct hashing | ✅ | `encodeValue.js:185-189` |
| Dynamic array encoding | ✅ | `encodeValue.js:31-54` |
| Fixed array encoding | ✅ | `encodeValue.js:31-54` |
| bytes encoding (keccak) | ✅ | `encodeValue.js:120-130` |
| string encoding (keccak) | ✅ | `encodeValue.js:110-118` |
| Domain field validation | ✅ | `Domain/hash.js` |
| Known test vectors | ❌ | Missing |

## Security Considerations

| Concern | Status | Notes |
|---------|--------|-------|
| Domain validation rejects unknown fields | ✅ | Prevents domain pollution |
| Type bounds checking | ✅ | uint8/int8 validated |
| Fixed bytes length validation | ✅ | bytes4 must be 4 bytes |
| Address length validation | ✅ | Must be 20 bytes |
| Signature malleability protection | ⚠️ | Handled in Secp256k1 layer |
| Recovery bit conversion | ✅ | v-27 conversion correct |
