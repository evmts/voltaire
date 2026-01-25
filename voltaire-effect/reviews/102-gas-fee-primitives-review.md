# Review 102: Gas & Fee Primitives

<issue>
<metadata>
priority: P1
files: [
  "voltaire-effect/src/primitives/Gas/BigInt.ts",
  "voltaire-effect/src/primitives/Gas/Number.ts",
  "voltaire-effect/src/primitives/Gas/Hex.ts",
  "voltaire-effect/src/primitives/Gas/index.ts",
  "voltaire-effect/src/primitives/GasPrice/BigInt.ts",
  "voltaire-effect/src/primitives/GasPrice/Number.ts",
  "voltaire-effect/src/primitives/GasPrice/Gwei.ts",
  "voltaire-effect/src/primitives/GasPrice/index.ts",
  "voltaire-effect/src/primitives/GasUsed/Number.ts",
  "voltaire-effect/src/primitives/GasUsed/index.ts",
  "voltaire-effect/src/primitives/GasEstimate/Number.ts",
  "voltaire-effect/src/primitives/GasEstimate/withBuffer.ts",
  "voltaire-effect/src/primitives/GasEstimate/index.ts",
  "voltaire-effect/src/primitives/GasRefund/Number.ts",
  "voltaire-effect/src/primitives/GasRefund/cappedRefund.ts",
  "voltaire-effect/src/primitives/GasRefund/index.ts",
  "voltaire-effect/src/primitives/BaseFeePerGas/BigInt.ts",
  "voltaire-effect/src/primitives/BaseFeePerGas/Gwei.ts",
  "voltaire-effect/src/primitives/BaseFeePerGas/toGwei.ts",
  "voltaire-effect/src/primitives/BaseFeePerGas/index.ts",
  "voltaire-effect/src/primitives/MaxFeePerGas/index.ts",
  "voltaire-effect/src/primitives/MaxPriorityFeePerGas/index.ts",
  "voltaire-effect/src/primitives/EffectiveGasPrice/BigInt.ts",
  "voltaire-effect/src/primitives/EffectiveGasPrice/Gwei.ts",
  "voltaire-effect/src/primitives/EffectiveGasPrice/calculate.ts",
  "voltaire-effect/src/primitives/EffectiveGasPrice/index.ts",
  "voltaire-effect/src/primitives/Denomination/EtherSchema.ts",
  "voltaire-effect/src/primitives/Denomination/WeiSchema.ts",
  "voltaire-effect/src/primitives/Denomination/GweiSchema.ts",
  "voltaire-effect/src/primitives/Denomination/index.ts"
]
reviews: ["044-fix-fee-estimator-precision-loss.md"]
</metadata>

<module_overview>
<purpose>
Gas and fee primitives for Ethereum transactions. Covers gas limits, gas prices, EIP-1559 fee parameters (baseFee, maxFee, maxPriorityFee), effective gas price calculation, gas estimation with buffers, refund caps (EIP-3529), and denomination conversions (wei/gwei/ether).
</purpose>
<current_status>
**MODERATE ISSUES** - Well-structured domain modeling with good BigInt precision for decode operations. **Critical gap**: No test files for any of the 10 modules. **High issues**: Number schema encoders risk truncation for large values, EffectiveGasPrice schema allows negative values, Denomination index missing exports.
</current_status>
</module_overview>

<findings>
<critical>
### 1. No Test Coverage (P0)

**Location**: All gas/fee primitive modules

**NO TESTS EXIST** for any of these modules:

| Module | Test File | Status |
|--------|-----------|--------|
| Gas | `Gas.test.ts` | ❌ Missing |
| GasPrice | `GasPrice.test.ts` | ❌ Missing |
| GasUsed | `GasUsed.test.ts` | ❌ Missing |
| GasEstimate | `GasEstimate.test.ts` | ❌ Missing |
| GasRefund | `GasRefund.test.ts` | ❌ Missing |
| BaseFeePerGas | `BaseFeePerGas.test.ts` | ❌ Missing |
| MaxFeePerGas | `MaxFeePerGas.test.ts` | ❌ Missing |
| MaxPriorityFeePerGas | `MaxPriorityFeePerGas.test.ts` | ❌ Missing |
| EffectiveGasPrice | `EffectiveGasPrice.test.ts` | ❌ Missing |
| Denomination | `Denomination.test.ts` | ❌ Missing |

**Impact**: Schema validation bugs, precision errors, and calculation issues undetected.

</critical>
<high>
### 2. Number Schema Truncation Risk (P1)

**Location**: All `Number.ts` files

```typescript
// Gas/Number.ts:71
encode: (gas) => ParseResult.succeed(globalThis.Number(gas))
```

JavaScript `Number` can only safely represent integers up to `2^53 - 1` (9,007,199,254,740,991).

**Risk Example**:
```typescript
// Max safe: 9,007,199,254,740,991
// 9007.2 gwei = 9,007,199,254,740,991 wei (at limit)
// 10000 gwei = 10,000,000,000,000,000 wei (TRUNCATES!)
```

**Files affected**:
- `Gas/Number.ts:71`
- `GasPrice/Number.ts:68`
- `GasUsed/Number.ts:44`
- `GasEstimate/Number.ts:45`
- `GasRefund/Number.ts:44`

### 3. EffectiveGasPrice Allows Negative Values (P1)

**Location**: `EffectiveGasPrice/BigInt.ts:14-16`

```typescript
// Current - missing >= 0n check
const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
  (u): u is EffectiveGasPriceType => typeof u === "bigint", // ❌ No >= 0n!
);

// All other gas primitives require:
(u): u is GasType => typeof u === "bigint" && u >= 0n  // ✅
```

**Impact**: Negative gas prices pass validation (impossible in Ethereum).

### 4. Denomination Module Missing Exports (P1)

**Location**: `Denomination/index.ts`

```typescript
// Current - only EtherSchema exported
export { EtherSchema, type EtherType } from "./EtherSchema.js";

// Missing:
// export { WeiSchema, type WeiType } from "./WeiSchema.js";
// export { GweiSchema, type GweiType } from "./GweiSchema.js";
```

</high>
<medium>
### 5. Gwei Number Conversion Throws on Decimals (P2)

**Location**: `BaseFeePerGas/Gwei.ts:41-42`

```typescript
const gwei = typeof value === "number" ? globalThis.BigInt(value) : value;
```

`BigInt(20.5)` throws `RangeError`. Should document or use `Math.floor()`.

### 6. Missing Hex Schemas for EIP-1559 Types (P2)

**Location**: EIP-1559 fee modules

BaseFeePerGas, MaxFeePerGas, MaxPriorityFeePerGas, EffectiveGasPrice lack `Hex` schemas unlike Gas and GasPrice which have them. Limits RPC response parsing flexibility.

### 7. No EIP-1559 Parameter Validation in calculate() (P2)

**Location**: `EffectiveGasPrice/calculate.ts:32-39`

```typescript
export const calculate = (
  baseFee: bigint,
  priorityFee: bigint,
  maxFeePerGas: bigint,
): EffectiveGasPriceType => {
  // No validation that maxFeePerGas >= baseFee (protocol requirement)
  const sum = baseFee + priorityFee;
  return (sum > maxFeePerGas ? maxFeePerGas : sum) as EffectiveGasPriceType;
};
```

</medium>
</findings>

<effect_improvements>
### Add MAX_SAFE_INTEGER Validation

```typescript
// Number.ts - add validation in encode
encode: (gas, _options, ast) => {
  if (gas > BigInt(Number.MAX_SAFE_INTEGER)) {
    return ParseResult.fail(
      new ParseResult.Type(ast, gas, "Value exceeds safe Number range (MAX_SAFE_INTEGER)")
    );
  }
  return ParseResult.succeed(globalThis.Number(gas));
}
```

### Fix EffectiveGasPrice Schema

```typescript
// EffectiveGasPrice/BigInt.ts
const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
  (u): u is EffectiveGasPriceType => typeof u === "bigint" && u >= 0n,  // Add >= 0n
  { identifier: "EffectiveGasPrice" },
);
```

### Export Denomination Schemas

```typescript
// Denomination/index.ts
export { EtherSchema, type EtherType } from "./EtherSchema.js";
export { WeiSchema, type WeiType } from "./WeiSchema.js";
export { GweiSchema, type GweiType } from "./GweiSchema.js";
```

### Handle Fractional Gwei

```typescript
// Gwei.ts - floor fractional values
const gwei = typeof value === "number" 
  ? globalThis.BigInt(Math.floor(value))  // Floor decimals
  : value;

// Or document behavior
/**
 * @throws RangeError if number has decimal portion
 * @example
 * Gwei.from(20)    // OK
 * Gwei.from(20.5)  // Throws - use Math.floor() first
 */
```

### Add EIP-1559 Validation to calculate()

```typescript
export const calculate = (
  baseFee: bigint,
  priorityFee: bigint,
  maxFeePerGas: bigint,
): Effect.Effect<EffectiveGasPriceType, InvalidFeeParametersError> =>
  Effect.gen(function* () {
    if (maxFeePerGas < baseFee) {
      return yield* Effect.fail(
        new InvalidFeeParametersError("maxFeePerGas must be >= baseFee")
      );
    }
    if (maxFeePerGas < priorityFee) {
      return yield* Effect.fail(
        new InvalidFeeParametersError("maxFeePerGas must be >= priorityFee")
      );
    }
    const sum = baseFee + priorityFee;
    return (sum > maxFeePerGas ? maxFeePerGas : sum) as EffectiveGasPriceType;
  });
```
</effect_improvements>

<viem_comparison>
**viem Gas Approach**:
- Uses native `bigint` throughout
- No branded types for gas values
- `parseGwei()`, `formatGwei()` for conversions
- `estimateFeesPerGas()` returns EIP-1559 params

**voltaire-effect Advantages**:
- Branded types prevent mixing gas/price values
- Effect Schema validation
- `withBuffer()` for gas estimate padding
- `cappedRefund()` for EIP-3529 compliance

**voltaire-effect Gaps**:
- Missing Number schema safety checks
- EffectiveGasPrice allows negatives
- No Hex schemas for fee types
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Create test files for all 10 modules** - Cover schemas, conversions, edge cases
2. **Add MAX_SAFE_INTEGER validation** - All Number schema encoders
3. **Fix EffectiveGasPrice >= 0n check** - Both BigInt.ts and Gwei.ts
4. **Export WeiSchema, GweiSchema** - Denomination/index.ts
5. **Add Hex schemas to fee types** - BaseFee, MaxFee, MaxPriorityFee, EffectiveGas
6. **Handle fractional gwei** - Either floor or document throw behavior
7. **Add EIP-1559 validation to calculate()** - Wrap in Effect with typed errors
8. **Add toEther helpers** - For display formatting
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Safe Number conversion with validation
const SafeNumber = <T extends bigint>(value: T, ast: S.AST): ParseResult.ParseResult<number> => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return ParseResult.fail(
      new ParseResult.Type(ast, value, `Value ${value} exceeds MAX_SAFE_INTEGER`)
    );
  }
  return ParseResult.succeed(Number(value));
};

// Pattern: EIP-1559 fee calculation with validation
export const calculateEffectiveGasPrice = (params: {
  baseFee: BaseFeePerGasType;
  priorityFee: MaxPriorityFeePerGasType;
  maxFee: MaxFeePerGasType;
}): Effect.Effect<EffectiveGasPriceType, InvalidFeeParametersError> =>
  Effect.gen(function* () {
    const { baseFee, priorityFee, maxFee } = params;
    // EIP-1559 invariant: maxFeePerGas >= baseFee + maxPriorityFeePerGas
    // But we only need maxFeePerGas >= baseFee for effective price calc
    if (maxFee < baseFee) {
      return yield* Effect.fail(new InvalidFeeParametersError("maxFee < baseFee"));
    }
    return EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee);
  });

// Pattern: Gas estimate with automatic buffer
export const estimateWithBuffer = (
  estimator: FeeEstimatorService,
  bufferPercent: number = 20,
) =>
  Effect.gen(function* () {
    const { gasLimit } = yield* estimator.estimate();
    return GasEstimate.withBuffer(gasLimit, bufferPercent);
  });
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- Gas BigInt/Number/Hex schema decode/encode
- GasPrice gwei conversions (20 gwei → 20_000_000_000n)
- GasPrice Number truncation at MAX_SAFE_INTEGER boundary
- GasEstimate withBuffer positive/negative/zero percentages
- GasRefund cappedRefund EIP-3529 (20% cap)
- EffectiveGasPrice calculate min(base+priority, max)
- EffectiveGasPrice rejects negative
- Denomination WeiSchema/GweiSchema/EtherSchema conversions
- BaseFeePerGas toGwei division behavior
- All schemas reject non-bigint input
</missing_coverage>
<test_code>
```typescript
// GasPrice.test.ts
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import * as GasPrice from "./index.js";

describe("GasPrice.BigInt", () => {
  it("decodes valid bigint", () => {
    const price = S.decodeSync(GasPrice.BigInt)(20_000_000_000n);
    expect(price).toBe(20_000_000_000n);
  });

  it("rejects negative values", () => {
    expect(() => S.decodeSync(GasPrice.BigInt)(-1n)).toThrow();
  });
});

describe("GasPrice.Gwei", () => {
  it("converts 20 gwei to wei", () => {
    const price = S.decodeSync(GasPrice.Gwei)(20);
    expect(price).toBe(20_000_000_000n);
  });

  it("handles bigint gwei input", () => {
    const price = S.decodeSync(GasPrice.Gwei)(20n);
    expect(price).toBe(20_000_000_000n);
  });

  it("encodes wei back to gwei", () => {
    const decoded = S.decodeSync(GasPrice.Gwei)(20n);
    const encoded = S.encodeSync(GasPrice.Gwei)(decoded);
    expect(encoded).toBe(20n);
  });
});

describe("GasPrice.Number truncation safety", () => {
  it("safely encodes values within safe range", () => {
    const safe = 9_007_199_254_740_991n;  // MAX_SAFE_INTEGER
    const encoded = S.encodeSync(GasPrice.Number)(safe as any);
    expect(encoded).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("should fail for values exceeding MAX_SAFE_INTEGER", () => {
    const unsafe = 10_000_000_000_000_000n;
    // After fix, this should throw
    expect(() => S.encodeSync(GasPrice.Number)(unsafe as any)).toThrow();
  });
});

// EffectiveGasPrice.test.ts
describe("EffectiveGasPrice.calculate", () => {
  it("returns baseFee + priorityFee when under max", () => {
    const result = EffectiveGasPrice.calculate(
      20n * 10n**9n,   // 20 gwei base
      2n * 10n**9n,    // 2 gwei priority
      30n * 10n**9n,   // 30 gwei max
    );
    expect(result).toBe(22n * 10n**9n);
  });

  it("caps at maxFeePerGas when sum exceeds", () => {
    const result = EffectiveGasPrice.calculate(
      25n * 10n**9n,   // 25 gwei base
      10n * 10n**9n,   // 10 gwei priority (sum = 35)
      30n * 10n**9n,   // 30 gwei max (caps here)
    );
    expect(result).toBe(30n * 10n**9n);
  });
});

// GasRefund.test.ts
describe("GasRefund.cappedRefund", () => {
  it("applies EIP-3529 20% cap", () => {
    // refund = 30000, gasUsed = 100000, cap = 20000
    const capped = GasRefund.cappedRefund(30000n, 100000n);
    expect(capped).toBe(20000n);
  });

  it("returns full refund when under cap", () => {
    const capped = GasRefund.cappedRefund(15000n, 100000n);
    expect(capped).toBe(15000n);
  });

  it("handles edge case at exact cap", () => {
    const capped = GasRefund.cappedRefund(20000n, 100000n);
    expect(capped).toBe(20000n);
  });
});

// GasEstimate.test.ts
describe("GasEstimate.withBuffer", () => {
  it("adds 20% buffer by default", () => {
    const buffered = GasEstimate.withBuffer(100000n, 20);
    expect(buffered).toBe(120000n);
  });

  it("supports fractional percentages", () => {
    const buffered = GasEstimate.withBuffer(100000n, 12.5);
    expect(buffered).toBe(112500n);
  });

  it("rejects negative buffer", () => {
    expect(() => GasEstimate.withBuffer(100000n, -10)).toThrow();
  });
});
```
</test_code>
</tests>

<docs>
- Document EIP-1559 fee parameters relationship
- Add gwei/wei conversion examples
- Document MAX_SAFE_INTEGER limitations
- Add gas estimation best practices
- Document EIP-3529 refund cap
</docs>

<api>
<changes>
1. All Number schemas - Add MAX_SAFE_INTEGER validation
2. `EffectiveGasPrice/BigInt.ts` - Add `>= 0n` check
3. `EffectiveGasPrice/Gwei.ts` - Add `>= 0n` check
4. `Denomination/index.ts` - Export WeiSchema, GweiSchema
5. Add `BaseFeePerGas/Hex.ts` - New schema
6. Add `MaxFeePerGas/Hex.ts` - New schema
7. Add `MaxPriorityFeePerGas/Hex.ts` - New schema
8. Add `EffectiveGasPrice/Hex.ts` - New schema
9. `calculateEffectiveGasPrice` - New Effect-wrapped version
</changes>
</api>

<references>
- [EIP-1559: Fee market change](https://eips.ethereum.org/EIPS/eip-1559)
- [EIP-3529: Reduction in refunds](https://eips.ethereum.org/EIPS/eip-3529)
- [EIP-4844: Shard Blob Transactions (blob gas)](https://eips.ethereum.org/EIPS/eip-4844)
- [Effect Schema documentation](https://effect.website/docs/schema)
- [JavaScript Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
</references>
</issue>

## Module File Inventory

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

## EIP-1559 Fee Relationship

```
┌─────────────────────────────────────────────────────────┐
│                    Transaction Fee                       │
│                                                          │
│  effectiveGasPrice = min(baseFee + priorityFee, maxFee) │
│                                                          │
│  where:                                                  │
│    baseFee        = current block base fee (burns)       │
│    priorityFee    = tip to validator                     │
│    maxFee         = user's maximum willingness to pay    │
│                                                          │
│  actual cost = gasUsed × effectiveGasPrice               │
└─────────────────────────────────────────────────────────┘
```
