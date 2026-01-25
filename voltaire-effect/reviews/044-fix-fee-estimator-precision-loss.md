# Fix FeeEstimator BigInt Precision Loss

<issue>
<metadata>
priority: P1
severity: high
category: correctness
files: [voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts]
reviews: [088-fee-formatter-multicall-review.md]
</metadata>

<problem>
DefaultFeeEstimator converts bigint to Number for multiplication, causing precision loss for large gas prices.

**Location**: `voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts#L107-L110`

```typescript
const baseFee = BigInt(baseFeeHex);
const multipliedBaseFee = BigInt(
  Math.ceil(Number(baseFee) * baseFeeMultiplier),  // ❌ Precision loss!
);
```

**Impact**:
- JavaScript Number has 53-bit precision (max safe: 9,007,199,254,740,992)
- baseFee in wei can exceed 2^53 during network congestion (>9007 Gwei)
- Silent corruption: no error thrown, just wrong fee calculation
- Stuck transactions when underestimated fees are submitted
- Users lose funds if transactions fail due to incorrect gas

**Example of precision loss**:
```typescript
const baseFee = 10_000_000_000_000_000n;  // 10 ETH in wei (extreme congestion)
const multiplier = 1.2;

// Current (WRONG):
Number(baseFee) // 10000000000000000 (loses precision beyond 53 bits)
BigInt(Math.ceil(Number(baseFee) * 1.2)) // Incorrect result

// For even larger values:
const hugeFee = 2n ** 60n;  // 1,152,921,504,606,846,976
Number(hugeFee)              // 1152921504606847000 (truncated!)
```
</problem>

<solution>
Use bigint-only arithmetic with basis points for fractional multipliers.

**Basis Points Approach** (1 bp = 0.01%, 10000 bp = 100%):
```typescript
// Constants
const BASIS_POINTS_DENOMINATOR = 10000n;

// Convert multiplier to basis points at config time
function multiplierToBps(multiplier: number): bigint {
  // 1.2 → 12000, 1.5 → 15000, 2.0 → 20000
  return BigInt(Math.round(multiplier * 10000));
}

// Pure bigint multiplication with ceiling division
function multiplyByBps(value: bigint, bps: bigint): bigint {
  const numerator = value * bps;
  // Ceiling division: (a + b - 1) / b
  return (numerator + BASIS_POINTS_DENOMINATOR - 1n) / BASIS_POINTS_DENOMINATOR;
}

// In DefaultFeeEstimator:
const baseFee = BigInt(baseFeeHex);
const bps = multiplierToBps(baseFeeMultiplier);  // 12000n for 1.2x
const multipliedBaseFee = multiplyByBps(baseFee, bps);
```
</solution>

<implementation>
<steps>
1. Add `BASIS_POINTS_DENOMINATOR` constant (10000n) to FeeEstimator module
2. Add `multiplierToBps(multiplier: number): bigint` utility function
3. Add `multiplyByBpsCeil(value: bigint, bps: bigint): bigint` utility with ceiling division
4. Refactor `DefaultFeeEstimator` to use `multiplyByBpsCeil` instead of Number conversion
5. Add validation for multiplier bounds (1.0 - 10.0)
6. Update JSDoc to document precision guarantees
</steps>

<code_changes>
```typescript
// voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts

/**
 * Basis points denominator for precise fractional calculations.
 * 10000 bp = 100%, 12000 bp = 120% (1.2x multiplier)
 */
const BASIS_POINTS_DENOMINATOR = 10000n;

/**
 * Converts a floating-point multiplier to basis points.
 * @param multiplier - Float multiplier (e.g., 1.2 for 20% increase)
 * @returns Basis points as bigint (e.g., 12000n)
 */
const multiplierToBps = (multiplier: number): bigint => {
  if (multiplier < 1 || multiplier > 10) {
    throw new Error(`Multiplier must be between 1.0 and 10.0, got ${multiplier}`);
  }
  return BigInt(Math.round(multiplier * 10000));
};

/**
 * Multiplies a bigint value by basis points with ceiling division.
 * Uses ceiling to avoid underestimating fees.
 * 
 * @param value - The bigint value to multiply
 * @param bps - Basis points (10000 = 1x, 12000 = 1.2x)
 * @returns The multiplied value, rounded up
 */
const multiplyByBpsCeil = (value: bigint, bps: bigint): bigint => {
  const numerator = value * bps;
  // Ceiling division: (a + b - 1) / b
  return (numerator + BASIS_POINTS_DENOMINATOR - 1n) / BASIS_POINTS_DENOMINATOR;
};

// In makeDefaultFeeEstimator:
const makeDefaultFeeEstimator = (
  baseFeeMultiplier: number = DEFAULT_BASE_FEE_MULTIPLIER,
): Layer.Layer<FeeEstimatorService, never, ProviderService> => {
  // Pre-compute basis points for efficiency
  const baseFeeMultiplierBps = multiplierToBps(baseFeeMultiplier);
  
  return Layer.effect(
    FeeEstimatorService,
    Effect.gen(function* () {
      const provider = yield* ProviderService;
      
      // ... estimateLegacy unchanged ...

      const estimateEIP1559 = (): Effect.Effect<
        FeeValuesEIP1559,
        FeeEstimationError,
        ProviderService
      > =>
        Effect.gen(function* () {
          const [block, priorityFee] = yield* Effect.all([/* ... */]);

          const baseFeeHex = block.baseFeePerGas;
          if (!baseFeeHex) {
            return yield* Effect.fail(
              new FeeEstimationError({
                message: "Block does not have baseFeePerGas (pre-EIP-1559 chain)",
              }),
            );
          }

          const baseFee = BigInt(baseFeeHex);
          // ✅ Pure bigint arithmetic - no precision loss
          const multipliedBaseFee = multiplyByBpsCeil(baseFee, baseFeeMultiplierBps);
          const maxFeePerGas = multipliedBaseFee + priorityFee;

          return {
            maxFeePerGas,
            maxPriorityFeePerGas: priorityFee,
          };
        });

      // ... rest unchanged ...
    }),
  );
};
```
</code_changes>

<patterns>
**Idiomatic bigint arithmetic patterns**:
```typescript
// Division with rounding modes
const floorDiv = (a: bigint, b: bigint) => a / b;
const ceilDiv = (a: bigint, b: bigint) => a / b + (a % b === 0n ? 0n : 1n);
const roundDiv = (a: bigint, b: bigint) => (a + b / 2n) / b;

// Percentage operations
const percent = (value: bigint, pct: bigint) => (value * pct) / 100n;
const basisPoints = (value: bigint, bps: bigint) => (value * bps) / 10000n;

// Safe multiplier conversion
const toScaledInt = (float: number, scale: number) => 
  BigInt(Math.round(float * scale));
```

**Effect-idiomatic config validation**:
```typescript
import * as Schema from "effect/Schema";

const FeeMultiplier = Schema.Number.pipe(
  Schema.greaterThanOrEqualTo(1.0),
  Schema.lessThanOrEqualTo(10.0),
  Schema.brand("FeeMultiplier")
);
```
</patterns>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { DefaultFeeEstimator, FeeEstimatorService, makeFeeEstimator } from "./index.js";
import { ProviderService } from "../Provider/index.js";

// Helper to create mock provider
function mockProvider(opts: { baseFee: bigint; priorityFee?: bigint }) {
  return Layer.succeed(ProviderService, {
    getBlock: () => Effect.succeed({
      baseFeePerGas: `0x${opts.baseFee.toString(16)}`,
    }),
    getMaxPriorityFeePerGas: () => Effect.succeed(opts.priorityFee ?? 0n),
    getGasPrice: () => Effect.succeed(opts.baseFee),
    // ... other methods
  } as any);
}

describe("FeeEstimator precision", () => {
  it("handles baseFee near Number.MAX_SAFE_INTEGER", async () => {
    // 2^53 - 1 = 9007199254740991
    const baseFee = BigInt(Number.MAX_SAFE_INTEGER);
    const multiplier = 1.2;
    
    // Expected: (9007199254740991 * 12000) / 10000 = 10808639105689189 (ceiling)
    const expected = ((baseFee * 12000n) + 9999n) / 10000n;
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee }))
      )
    );
    
    expect(result.maxFeePerGas).toBe(expected);
  });

  it("handles baseFee exceeding 2^53 (beyond JS Number precision)", async () => {
    // 2^60 = 1,152,921,504,606,846,976 wei ≈ 1152 ETH
    const baseFee = 2n ** 60n;
    const multiplier = 1.2;
    
    // Number(baseFee) would lose precision!
    // Expected with ceiling: ceil((2^60 * 12000) / 10000)
    const expected = ((baseFee * 12000n) + 9999n) / 10000n;
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee }))
      )
    );
    
    // Verify no precision loss
    expect(result.maxFeePerGas).toBe(expected);
    // Verify it's NOT the wrong value from Number conversion
    const wrongValue = BigInt(Math.ceil(Number(baseFee) * 1.2));
    expect(result.maxFeePerGas).not.toBe(wrongValue);
  });

  it("handles 100 ETH baseFee with 1.5x multiplier", async () => {
    const baseFee = 100n * 10n ** 18n;  // 100 ETH in wei
    const multiplier = 1.5;
    
    // Expected: 150 ETH (ceiling)
    const expected = 150n * 10n ** 18n;
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee }))
      )
    );
    
    expect(result.maxFeePerGas).toBe(expected);
  });

  it("rounds up to avoid underestimation", async () => {
    const baseFee = 1n;  // 1 wei
    const multiplier = 1.2;
    
    // 1 * 12000 / 10000 = 1.2 → should round to 2 (ceiling)
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee }))
      )
    );
    
    // Should round up, not down
    expect(result.maxFeePerGas).toBe(2n);
  });

  it("handles exactly 1.0x multiplier (no change)", async () => {
    const baseFee = 12345678901234567890n;
    const multiplier = 1.0;
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee, priorityFee: 0n }))
      )
    );
    
    // With priority fee = 0, should equal baseFee
    expect(result.maxFeePerGas).toBe(baseFee);
  });

  it("adds priority fee correctly after multiplication", async () => {
    const baseFee = 100n * 10n ** 9n;  // 100 Gwei
    const priorityFee = 2n * 10n ** 9n;  // 2 Gwei
    const multiplier = 1.2;
    
    // Expected: 100 * 1.2 + 2 = 122 Gwei
    const expectedMaxFee = 120n * 10n ** 9n + priorityFee;
    
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const fe = yield* FeeEstimatorService;
        return yield* fe.estimateFeesPerGas("eip1559");
      }).pipe(
        Effect.provide(makeFeeEstimator(multiplier)),
        Effect.provide(mockProvider({ baseFee, priorityFee }))
      )
    );
    
    expect(result.maxFeePerGas).toBe(expectedMaxFee);
    expect(result.maxPriorityFeePerGas).toBe(priorityFee);
  });

  it("rejects multiplier below 1.0", () => {
    expect(() => makeFeeEstimator(0.9)).toThrow(/between 1.0 and 10.0/);
  });

  it("rejects multiplier above 10.0", () => {
    expect(() => makeFeeEstimator(11)).toThrow(/between 1.0 and 10.0/);
  });
});

describe("multiplyByBpsCeil utility", () => {
  it("ceiling division rounds up fractional results", () => {
    // 7 * 12000 / 10000 = 8.4 → 9
    const result = multiplyByBpsCeil(7n, 12000n);
    expect(result).toBe(9n);
  });

  it("exact division returns exact result", () => {
    // 10 * 12000 / 10000 = 12.0 → 12
    const result = multiplyByBpsCeil(10n, 12000n);
    expect(result).toBe(12n);
  });

  it("handles very large values", () => {
    const huge = 2n ** 200n;
    const bps = 15000n; // 1.5x
    const expected = ((huge * 15000n) + 9999n) / 10000n;
    expect(multiplyByBpsCeil(huge, bps)).toBe(expected);
  });
});
```
</test_cases>
</tests>

<docs>
**JSDoc for new utilities**:
```typescript
/**
 * Multiplies a bigint value by a fractional multiplier using basis points.
 * Avoids precision loss from Number conversion for values > 2^53.
 * Uses ceiling division to avoid underestimating fees.
 * 
 * @param value - The bigint value to multiply
 * @param bps - Basis points (10000 = 1x, 12000 = 1.2x)
 * @returns The multiplied value, rounded up
 * 
 * @example
 * multiplyByBpsCeil(100n, 12000n) // 120n (1.2x)
 * multiplyByBpsCeil(7n, 12000n)   // 9n (ceiling of 8.4)
 * multiplyByBpsCeil(1000n, 15000n) // 1500n (1.5x)
 */
export function multiplyByBpsCeil(value: bigint, bps: bigint): bigint;

/**
 * Converts a floating-point multiplier to basis points.
 * 
 * @param multiplier - Float multiplier (e.g., 1.2 for 20% increase)
 * @returns Basis points as bigint (e.g., 12000n)
 * 
 * @throws If multiplier is < 1.0 or > 10.0
 */
export function multiplierToBps(multiplier: number): bigint;
```
</docs>

<api>
<before>
```typescript
// Internal calculation (lossy)
const multipliedBaseFee = BigInt(
  Math.ceil(Number(baseFee) * baseFeeMultiplier)
);
```
</before>

<after>
```typescript
// Internal calculation (lossless)
const baseFeeMultiplierBps = multiplierToBps(baseFeeMultiplier);
const multipliedBaseFee = multiplyByBpsCeil(baseFee, baseFeeMultiplierBps);
```
</after>

<breaking>
None - internal implementation change only. Public API unchanged.
Fee estimates may differ slightly due to proper rounding (always higher, never lower).
</breaking>
</api>

<references>
- [Ethereum EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) - Base fee mechanism
- [MDN: BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- [DefaultFeeEstimator.ts#L107-L110](file:///Users/williamcory/voltaire/voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts#L107-L110)
- [Review 088: Fee Formatter Multicall](./088-fee-formatter-multicall-review.md)
</references>
</issue>
