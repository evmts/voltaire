# Review 103: AccessList (EIP-2930) and Authorization (EIP-7702) Primitives

**Files Reviewed:**
- [voltaire-effect/src/primitives/AccessList/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/AccessList/index.ts)
- [voltaire-effect/src/primitives/AccessList/Rpc.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/AccessList/Rpc.ts)
- [voltaire-effect/src/primitives/Authorization/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Authorization/index.ts)
- [voltaire-effect/src/primitives/Authorization/Rpc.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Authorization/Rpc.ts)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| EIP-2930 AccessList format | ✅ | Correct structure `[{address, storageKeys}...]` |
| EIP-7702 Authorization format | ✅ | Correct tuple `[chainId, address, nonce, yParity, r, s]` |
| RPC serialization | ⚠️ | Works but has issues (see below) |
| Schema validation | ⚠️ | Missing address checksum, hex format validation |
| Effect patterns | ⚠️ | Uses imperative helpers instead of Schema compositions |
| Test coverage | ❌ | **No tests exist for AccessList or Authorization in voltaire-effect** |

---

## 1. EIP-2930 AccessList Format ✅

**EIP-2930 Spec:** `[[{20 bytes}, [{32 bytes}...]],...]`

Current implementation correctly models:
- `address`: 20-byte Uint8Array
- `storageKeys`: Array of 32-byte Uint8Arrays (HashType)

```typescript
// Rpc.ts:77-80
const items: Item[] = input.map((item) => ({
  address: parseAddress(item.address),  // 20 bytes
  storageKeys: item.storageKeys.map(parseHash),  // 32 bytes each
}));
```

**✅ Correct:** Matches EIP-2930 structure.

---

## 2. EIP-7702 Authorization Format ✅

**EIP-7702 Spec:** `[chain_id, address, nonce, y_parity, r, s]`

Current implementation correctly models all fields:
- `chainId`: bigint (can be 0 for cross-chain)
- `address`: 20-byte AddressType
- `nonce`: bigint
- `yParity`: 0 or 1
- `r`, `s`: 32-byte Uint8Arrays

**✅ Correct:** Matches EIP-7702 spec including `MAGIC = 0x05` for signing.

---

## 3. RPC Serialization Issues ⚠️

### Issue 3.1: hexToBytes lacks validation

```typescript
// AccessList/Rpc.ts:107-119
function hexToBytes(hex: string, expectedLength: number): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length !== expectedLength * 2) {
    throw new Error(`Expected ${expectedLength} bytes...`);
  }
  // No validation that characters are valid hex!
  for (let i = 0; i < expectedLength; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
}
```

**Problem:** `parseInt` with radix 16 silently returns `NaN` for invalid hex, which becomes `0`.

```typescript
parseInt("zz", 16)  // NaN
```

**Fix:** Validate hex characters before parsing:
```typescript
if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
  throw new Error("Invalid hex characters");
}
```

### Issue 3.2: Duplicate hexToBytes/toHexString functions

Both `AccessList/Rpc.ts` and `Authorization/Rpc.ts` define identical utility functions. Should import from shared module.

### Issue 3.3: No checksum validation for addresses

EIP-55 checksummed addresses are accepted but not validated:
```typescript
"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"  // Checksummed - OK
"0x742d35cc6634c0532925a3b844bc9e7595f251e3"  // Lowercase - OK  
"0x742d35CC6634C0532925A3B844BC9E7595F251E3"  // Bad checksum - SHOULD warn or fail
```

---

## 4. Schema Validation Issues ⚠️

### Issue 4.1: Authorization.Rpc allows non-hex nonce/chainId

```typescript
// Authorization/Rpc.ts:69-76
const AuthorizationInputSchema = S.Struct({
  chainId: S.Union(S.String, S.Number, S.BigIntFromSelf),  // "0x1" or 1 or 1n
  nonce: S.Union(S.String, S.Number, S.BigIntFromSelf),
  // ...
});
```

**Problem:** Accepts any string, not just hex strings:
```typescript
{ chainId: "hello" }  // Should fail but goes to BigInt("hello") -> throws
```

The error is caught but produces a generic parse error. Should use stricter input schema.

### Issue 4.2: No validation of yParity range in schema

```typescript
yParity: S.Number,  // Accepts any number, should be 0 or 1
```

**Fix:** Use `S.Literal(0)` or `S.Literal(1)` or `S.filter`.

### Issue 4.3: AccessList.is() type guard is weak

```typescript
// Rpc.ts:55-58
const AccessListTypeSchema = S.declare<BrandedAccessList>(
  (u): u is BrandedAccessList => Array.isArray(u) && AccessList.is(u),
);
```

This relies on the underlying `AccessList.is()` which may not deeply validate all items.

---

## 5. Effect Patterns Issues ⚠️

### Issue 5.1: Imperative helpers instead of Schema composition

Current approach uses try/catch with imperative functions:

```typescript
decode: (input, _options, ast) => {
  try {
    const items: Item[] = input.map((item) => ({
      address: parseAddress(item.address),
      storageKeys: item.storageKeys.map(parseHash),
    }));
    return ParseResult.succeed(AccessList.from(items));
  } catch (e) {
    return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message));
  }
},
```

**Better:** Compose with Address and Hash schemas:

```typescript
import * as Address from "../Address/index.js";
import * as Hash from "../Hash/index.js";

const AccessListItemSchema = S.Struct({
  address: Address.Hex,  // Reuse existing schema
  storageKeys: S.Array(Hash.Hex),  // Reuse existing schema
});
```

This gives:
- Proper error paths
- Consistent validation
- Better error messages

### Issue 5.2: Error messages lose context

```typescript
return ParseResult.fail(
  new ParseResult.Type(ast, input, (e as Error).message),
);
```

This loses the original error type and stack. Use `ParseResult.mapError` or create typed Effect errors.

---

## 6. Test Coverage ❌ CRITICAL

**No tests exist for AccessList or Authorization in voltaire-effect.**

The underlying voltaire primitives have tests:
- `src/primitives/AccessList/AccessList.test.ts` ✅
- `src/primitives/Authorization/Authorization.test.ts` ✅

But the Effect Schema wrappers have **zero test coverage**.

### Required Tests

#### AccessList.Rpc

```typescript
describe("AccessList.Rpc", () => {
  it("decodes valid access list", () => {});
  it("encodes access list back to RPC format", () => {});
  it("round-trips correctly", () => {});
  it("fails on invalid address length", () => {});
  it("fails on invalid storage key length", () => {});
  it("fails on missing 0x prefix", () => {});
  it("fails on invalid hex characters", () => {});
  it("handles empty access list", () => {});
  it("handles empty storageKeys array", () => {});
});
```

#### Authorization.Rpc

```typescript
describe("Authorization.Rpc", () => {
  it("decodes valid authorization", () => {});
  it("encodes authorization back to RPC format", () => {});
  it("round-trips correctly", () => {});
  it("accepts chainId as string/number/bigint", () => {});
  it("accepts nonce as string/number/bigint", () => {});
  it("fails on invalid yParity (not 0 or 1)", () => {});
  it("fails on zero address", () => {});
  it("fails on r >= SECP256K1_N", () => {});
  it("fails on s > SECP256K1_HALF_N (malleable)", () => {});
  it("accepts chainId 0 (cross-chain)", () => {});
});
```

---

## 7. Missing Features

### 7.1: No Checksummed export for AccessList addresses

Other primitives export both `Hex` and `Checksummed`:
```typescript
export { Hex, Checksummed } from "./Rpc.js";
```

AccessList only has `Rpc` with lowercase hex output.

### 7.2: No validation of authorization signature ranges

The Authorization.Rpc calls `Authorization.validate(auth)` but errors are caught generically. Should surface specific error types.

### 7.3: No support for EIP-7702 delegation indicator

EIP-7702 spec includes `0xef0100 || address` delegation indicator format. No helper to create/detect this.

---

## Action Items

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | No tests | Add AccessList.test.ts and Authorization.test.ts |
| P1 | hexToBytes invalid hex | Add regex validation before parseInt |
| P1 | yParity not constrained | Use `S.Union(S.Literal(0), S.Literal(1))` |
| P2 | Duplicate utilities | Extract to shared module |
| P2 | Imperative decode | Compose with Address.Hex/Hash.Hex schemas |
| P3 | No checksum validation | Add warning or optional strict mode |
| P3 | Missing checksummed export | Add AccessList with checksummed addresses |

---

## EIP Compliance Summary

| EIP | Section | Status |
|-----|---------|--------|
| EIP-2930 | Access list format `[[addr, keys],...]` | ✅ |
| EIP-2930 | Address 20 bytes | ✅ |
| EIP-2930 | Storage key 32 bytes | ✅ |
| EIP-2930 | Gas costs (2400/1900) | ⚠️ Defined in base lib, not Effect |
| EIP-7702 | Authorization tuple | ✅ |
| EIP-7702 | MAGIC = 0x05 | ✅ (in base lib) |
| EIP-7702 | chainId=0 for cross-chain | ✅ |
| EIP-7702 | yParity 0 or 1 | ⚠️ Not validated in schema |
| EIP-7702 | s ≤ N/2 (malleability) | ✅ (via validate()) |
| EIP-7702 | Delegation indicator format | ❌ Not implemented |
