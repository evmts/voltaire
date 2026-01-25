# Gas & Fee Primitives Deep Review

**Review ID**: 102  
**Date**: 2025-01-25  
**Scope**: Gas, GasPrice, GasUsed, GasEstimate, GasRefund, BaseFeePerGas, MaxFeePerGas, MaxPriorityFeePerGas, EffectiveGasPrice, Denomination

---

## Executive Summary

**Overall Status**: ⚠️ Moderate Issues

The gas and fee primitives are well-structured with good domain modeling, but have several issues requiring attention:
- **Critical**: Missing test files for all 10 modules
- **High**: Potential precision loss in Number schema encoders
- **Medium**: Missing validation in EffectiveGasPrice schema
- **Low**: Denomination module incomplete exports

---

## 1. BigInt Precision Analysis

### ✅ PASS: Decode operations use BigInt throughout

All decode operations correctly use `BigInt`:
- `Uint.from()` returns BigInt
- `Gas.GasPrice.from()` returns BigInt
- Gwei conversions use `BigInt(value)` before multiplication

### ⚠️ ISSUE: Number schema encoders risk truncation

**Files affected**:
- `Gas/Number.ts:71` - `globalThis.Number(gas)`
- `GasPrice/Number.ts:68` - `globalThis.Number(gasPrice)`
- `GasUsed/Number.ts:44` - `globalThis.Number(g)`
- `GasEstimate/Number.ts:45` - `globalThis.Number(gasEstimate)`
- `GasRefund/Number.ts:44` - `globalThis.Number(g)`

**Problem**: JavaScript `Number` can only safely represent integers up to `2^53 - 1`. Gas prices in wei can exceed this (e.g., 100 gwei = 100,000,000,000 wei, which is safe, but extreme values could truncate).

**Example scenario**:
```typescript
// Max safe: 9,007,199,254,740,991
// 9007.2 gwei = 9,007,199,254,740,991 wei (at limit)
// 10000 gwei = 10,000,000,000,000,000 wei (TRUNCATES)
```

**Recommendation**: Add validation in Number schema encode to throw if value exceeds `Number.MAX_SAFE_INTEGER`:

```typescript
encode: (gas, _options, ast) => {
  if (gas > BigInt(Number.MAX_SAFE_INTEGER)) {
    return ParseResult.fail(
      new ParseResult.Type(ast, gas, "Value exceeds safe Number range")
    );
  }
  return ParseResult.succeed(globalThis.Number(gas));
}
```

**Risk Level**: Medium (unlikely for gas amounts, possible for prices in wei)

---

## 2. Unit Conversions (Wei/Gwei/Ether)

### ✅ PASS: Consistent GWEI constant

All modules use `const GWEI = 1_000_000_000n` correctly.

### ✅ PASS: Gwei-to-Wei multiplication

```typescript
// BaseFeePerGas/Gwei.ts:52-53
return ParseResult.succeed((gwei * GWEI) as unknown as BaseFeePerGasType);
```

BigInt multiplication preserves precision.

### ✅ PASS: Wei-to-Gwei division

```typescript
// BaseFeePerGas/toGwei.ts:28
export const toGwei = (value: BaseFeePerGasType): bigint => value / GWEI;
```

Integer division is expected behavior (floors the result).

### ⚠️ OBSERVATION: No ether-level conversions exposed

The gas/fee modules only expose gwei conversions. The Denomination module has EtherSchema but doesn't provide ether↔wei conversion utilities for gas prices.

**Recommendation**: Consider adding `toEther()` helpers for display purposes, or document that users should divide by `10n**18n` manually.

---

## 3. EIP-1559 Calculations

### ✅ PASS: EffectiveGasPrice.calculate implementation

```typescript
// EffectiveGasPrice/calculate.ts:32-39
export const calculate = (
  baseFee: bigint,
  priorityFee: bigint,
  maxFeePerGas: bigint,
): EffectiveGasPriceType => {
  const sum = baseFee + priorityFee;
  return (sum > maxFeePerGas ? maxFeePerGas : sum) as EffectiveGasPriceType;
};
```

Correctly implements `min(baseFee + priorityFee, maxFeePerGas)`.

### ⚠️ ISSUE: No validation for invalid EIP-1559 parameters

**Problem**: The calculate function doesn't validate:
- `maxFeePerGas >= baseFee` (required by protocol)
- `maxFeePerGas >= priorityFee` (implicit requirement)

**Impact**: Silently produces potentially invalid effective prices.

**Recommendation**: Add validation or document that inputs must be valid EIP-1559 params.

### ⚠️ ISSUE: EffectiveGasPrice.BigInt allows negative values

```typescript
// EffectiveGasPrice/BigInt.ts:14-16
const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
  (u): u is EffectiveGasPriceType => typeof u === "bigint", // No >= 0n check!
  { identifier: "EffectiveGasPrice" },
);
```

All other gas primitives require `u >= 0n`. This is inconsistent.

**Files affected**:
- `EffectiveGasPrice/BigInt.ts:15`
- `EffectiveGasPrice/Gwei.ts:14`

**Fix**: Add `&& u >= 0n` to the validation.

---

## 4. Gas Buffer Calculations

### ✅ PASS: withBuffer uses BigInt arithmetic

```typescript
// Underlying implementation (src/primitives/GasEstimate/withBuffer.js:25)
const buffer = (this * BigInt(Math.floor(percentageBuffer * 100))) / 10000n;
```

Supports fractional percentages (e.g., 12.5%) by multiplying by 100 first.

### ✅ PASS: Negative buffer rejection

```typescript
if (percentageBuffer < 0) {
  throw new Error(`Padding percentage must be non-negative, got ${percentageBuffer}`);
}
```

### ⚠️ OBSERVATION: Buffer wrapper loses precision info

```typescript
// GasEstimate/withBuffer.ts:34-38
export const withBuffer = (
  estimate: GasEstimateType,
  percentageBuffer: number, // number, not BigInt
): GasEstimateType => VoltaireGasEstimate.GasEstimate.withBuffer(estimate, percentageBuffer);
```

Using `number` for percentage is fine since typical values (10-30%) are well within safe range.

---

## 5. Refund Cap Calculations

### ✅ PASS: EIP-3529 cap implementation

```typescript
// Underlying implementation (src/primitives/GasRefund/cappedRefund.js:22-25)
export function cappedRefund(gasUsed) {
  const cap = gasUsed / 5n; // 20% cap
  const capped = this > cap ? cap : this;
  return from(capped);
}
```

Correctly implements `min(refund, gasUsed / 5)`.

### ✅ PASS: Effect wrapper signature

```typescript
// GasRefund/cappedRefund.ts:35-38
export const cappedRefund = (
  refund: bigint | number | string,
  gasUsed: bigint,
): GasRefundType => GasRefund.cappedRefund(refund, gasUsed);
```

Flexible input types with bigint-only gasUsed (correct).

### ⚠️ OBSERVATION: Pre-London cap not exposed

The underlying Zig implementation has `cappedRefundPreLondon` (gasUsed / 2 = 50% cap), but it's not exposed in the Effect wrappers. This may be intentional since London is now the default.

---

## 6. Schema Validations

### ✅ PASS: Non-negative validation on most types

Most schemas properly validate `u >= 0n`:

```typescript
(u): u is GasType => typeof u === "bigint" && u >= 0n
```

### ❌ FAIL: EffectiveGasPrice missing non-negative check

As noted above, EffectiveGasPrice allows negative values.

### ✅ PASS: Gwei schemas handle number/bigint union

```typescript
S.Union(S.Number, S.BigIntFromSelf)
```

With proper BigInt conversion:
```typescript
const gwei = typeof value === "number" ? globalThis.BigInt(value) : value;
```

### ⚠️ ISSUE: Gwei number conversion truncates decimals

```typescript
// BaseFeePerGas/Gwei.ts:41-42
const gwei = typeof value === "number" ? globalThis.BigInt(value) : value;
```

`BigInt(20.5)` throws. Should document that fractional gwei is not supported or use `Math.floor()`:

```typescript
const gwei = typeof value === "number" ? globalThis.BigInt(Math.floor(value)) : value;
```

---

## 7. Test Coverage

### ❌ CRITICAL: No test files for gas/fee primitives

**Missing test files**:
- `Gas/*.test.ts` - ❌
- `GasPrice/*.test.ts` - ❌
- `GasUsed/*.test.ts` - ❌
- `GasEstimate/*.test.ts` - ❌
- `GasRefund/*.test.ts` - ❌
- `BaseFeePerGas/*.test.ts` - ❌
- `MaxFeePerGas/*.test.ts` - ❌
- `MaxPriorityFeePerGas/*.test.ts` - ❌
- `EffectiveGasPrice/*.test.ts` - ❌
- `Denomination/*.test.ts` - ❌

**Required test coverage**:

```typescript
// Example: GasPrice.test.ts
describe("GasPrice", () => {
  describe("BigInt schema", () => {
    it("decodes valid bigint", () => {});
    it("rejects negative values", () => {});
    it("encodes to bigint", () => {});
  });
  
  describe("Gwei schema", () => {
    it("converts gwei to wei", () => {
      // 20 gwei -> 20_000_000_000n wei
    });
    it("handles number input", () => {});
    it("handles bigint input", () => {});
    it("encodes wei back to gwei", () => {});
  });
  
  describe("Number schema truncation", () => {
    it("safely encodes values within safe range", () => {});
    it("handles MAX_SAFE_INTEGER boundary", () => {});
  });
});

// Example: EffectiveGasPrice.test.ts
describe("EffectiveGasPrice.calculate", () => {
  it("returns baseFee + priorityFee when under max", () => {
    const result = calculate(20n * 10n**9n, 2n * 10n**9n, 30n * 10n**9n);
    expect(result).toBe(22n * 10n**9n);
  });
  
  it("caps at maxFeePerGas", () => {
    const result = calculate(25n * 10n**9n, 10n * 10n**9n, 30n * 10n**9n);
    expect(result).toBe(30n * 10n**9n);
  });
});

// Example: GasRefund.test.ts
describe("GasRefund.cappedRefund", () => {
  it("applies EIP-3529 cap", () => {
    // refund = 30000, gasUsed = 100000, cap = 20000
    expect(cappedRefund(30000n, 100000n)).toBe(20000n);
  });
  
  it("returns full refund when under cap", () => {
    expect(cappedRefund(15000n, 100000n)).toBe(15000n);
  });
});
```

---

## 8. Additional Findings

### 8.1 Denomination Module Incomplete

**File**: `Denomination/index.ts`

```typescript
export { EtherSchema, type EtherType } from "./EtherSchema.js";
// Missing: WeiSchema, GweiSchema
```

WeiSchema.ts and GweiSchema.ts exist but aren't exported from index.ts.

**Fix**:
```typescript
export { EtherSchema, type EtherType } from "./EtherSchema.js";
export { WeiSchema, type WeiType } from "./WeiSchema.js";
export { GweiSchema, type GweiType } from "./GweiSchema.js";
```

### 8.2 Missing Hex Schema for EIP-1559 Types

BaseFeePerGas, MaxFeePerGas, MaxPriorityFeePerGas, and EffectiveGasPrice lack Hex schemas, unlike Gas and GasPrice which have them. This limits RPC response parsing flexibility.

### 8.3 Inconsistent Type Definitions

- `Gas/Number.ts` defines its own `GasType`
- `GasPrice/Number.ts` imports from `@tevm/voltaire`
- Some modules use `ReturnType<typeof X.from>`

**Recommendation**: Standardize on either local branded types or imported types from voltaire.

### 8.4 Missing toWei Helper in Fee Types

GasPrice has `fromGwei` but the fee types (BaseFeePerGas, MaxFeePerGas, etc.) only have `toGwei`. Consider adding `toWei` for completeness (even though it's just a cast).

---

## Summary of Required Actions

### Critical (P0)
1. Add test files for all 10 modules

### High (P1)
2. Add Number.MAX_SAFE_INTEGER validation in Number schema encoders
3. Fix EffectiveGasPrice schema to require non-negative values

### Medium (P2)
4. Export WeiSchema and GweiSchema from Denomination/index.ts
5. Handle fractional gwei in Gwei schemas (document or floor)
6. Add Hex schemas to EIP-1559 fee types

### Low (P3)
7. Add toEther/toWei helpers for display formatting
8. Expose pre-London refund cap if needed for historical analysis
9. Standardize type definition patterns across modules

---

## Appendix: File Inventory

| Module | Files | LOC | Has Tests |
|--------|-------|-----|-----------|
| Gas | 4 | 132 | ❌ |
| GasPrice | 5 | 168 | ❌ |
| GasUsed | 4 | 118 | ❌ |
| GasEstimate | 5 | 145 | ❌ |
| GasRefund | 4 | 115 | ❌ |
| BaseFeePerGas | 4 | 142 | ❌ |
| MaxFeePerGas | 4 | 142 | ❌ |
| MaxPriorityFeePerGas | 4 | 148 | ❌ |
| EffectiveGasPrice | 7 | 212 | ❌ |
| Denomination | 4 | 176 | ❌ |
| **Total** | **45** | **~1,500** | **0/10** |
