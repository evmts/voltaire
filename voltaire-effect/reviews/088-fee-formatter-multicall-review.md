# Review 088: FeeEstimator, Formatter, Multicall, and AbiEncoder Services

## Summary

| Service | Status | Critical Issues |
|---------|--------|-----------------|
| FeeEstimator | ⚠️ Has Issues | Precision loss (review 044 still unfixed) |
| Formatter | ✅ Good | Minimal passthrough, correct patterns |
| Multicall | ✅ Good | Dual implementations, well-tested |
| AbiEncoder | ✅ Good | Effect wrapping, proper errors |

---

## FeeEstimator

### ❌ CRITICAL: Precision Loss Still Present

**Location**: [DefaultFeeEstimator.ts#L107-L110](file:///Users/williamcory/voltaire/voltaire-effect/src/services/FeeEstimator/DefaultFeeEstimator.ts#L107-L110)

```typescript
const baseFee = BigInt(baseFeeHex);
const multipliedBaseFee = BigInt(
  Math.ceil(Number(baseFee) * baseFeeMultiplier),  // ❌ Precision loss!
);
```

Review 044 identified this but it remains unfixed. JavaScript `Number` has 53-bit precision. When `baseFee > 2^53` (≈9007 Gwei), silent precision loss occurs.

**Fix**:
```typescript
// Use basis points for configurable multiplier
function multiplyBigIntByFloat(value: bigint, multiplier: number): bigint {
  const bps = BigInt(Math.round(multiplier * 10000));
  return (value * bps) / 10000n;
}

const multipliedBaseFee = multiplyBigIntByFloat(baseFee, baseFeeMultiplier);
```

**Acceptance Criteria**:
- [ ] Remove `Number()` conversion for baseFee
- [ ] Use bigint-only arithmetic  
- [ ] Add test: `baseFee = 2n ** 60n` (16,000+ Gwei)

### ✅ Effect Patterns: Correct

- Layer composition via `Layer.effect`
- Proper `Effect.gen` + `yield*`
- Error mapping with `Effect.mapError`
- Concurrent fetching: `Effect.all([getBlock, getMaxPriorityFeePerGas])`

### ✅ Error Handling: Correct

- `FeeEstimationError` is a proper `Data.TaggedError`
- Error wrapping preserves cause chain
- Pre-EIP-1559 chain detection with clear message

### ❌ Missing Tests

No test files found for FeeEstimator. Needs:
- Legacy fee estimation
- EIP-1559 fee estimation
- Pre-EIP-1559 chain handling
- Custom multiplier
- Precision test with large baseFee

---

## Formatter

### ✅ Architecture: Correct

Passthrough design is appropriate for a formatter service—chains override with custom formatters.

**Location**: [DefaultFormatter.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Formatter/DefaultFormatter.ts)

```typescript
export const DefaultFormatter = Layer.succeed(FormatterService, {
  formatBlock: (rpc) => Effect.succeed(rpc),
  formatTransaction: (rpc) => Effect.succeed(rpc),
  formatReceipt: (rpc) => Effect.succeed(rpc),
  formatRequest: (tx) => Effect.succeed(tx),
});
```

### ✅ Error Handling: Correct

- `FormatError` is a proper `Data.TaggedError`
- Includes `input`, `type`, `message` fields
- Never fails in default implementation (intentional)

### ⚠️ Missing: Chain-Specific Formatters

The docs mention Optimism/Arbitrum/zkSync formatters but they don't exist. This is acceptable for current scope but should be tracked.

### ❌ Missing Tests

No test files found for Formatter.

---

## Multicall

### ✅ Dual Implementation: Good

Two multicall implementations exist:

1. **Low-level Service**: [Multicall/DefaultMulticall.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Multicall/DefaultMulticall.ts)
   - Uses aggregate3 function
   - Manual encoding/decoding
   - Correct Multicall3 address

2. **High-level Action**: [Provider/actions/multicall.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Provider/actions/multicall.ts)
   - Contract-aware batching
   - `allowFailure` type inference
   - ABI decoding per call

### ✅ Test Coverage: Good

[multicall.test.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Provider/actions/multicall.test.ts) covers:
- Basic multicall with 2 calls
- Correct Multicall3 address
- allowFailure: true (default) 
- allowFailure: false
- Single call
- Empty array
- Block tag

### ⚠️ Missing: Batch Size Chunking

Review 008 mentioned `batchSize` param for large multicalls. Not implemented—calls with 100+ items could hit gas limits.

**Suggested Addition**:
```typescript
export interface MulticallParams<TAllowFailure extends boolean = true> {
  readonly contracts: readonly MulticallContract[];
  readonly allowFailure?: TAllowFailure;
  readonly blockTag?: BlockTag;
  readonly batchSize?: number;  // Default 1000
}
```

### ⚠️ Low-Level Multicall Service Untested

`Multicall/DefaultMulticall.ts` has no dedicated tests. The action tests cover functionality indirectly.

### ⚠️ Minor: Throw in Effect Context

**Location**: [multicall.ts#L143](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Provider/actions/multicall.ts#L143)

```typescript
if (!r.success) {
  if (allowFailure) {
    return { status: "failure" as const, error: new Error("Call reverted") };
  }
  throw new Error(`Call ${i} failed`);  // ❌ Should use Effect.fail
}
```

Should be:
```typescript
return yield* Effect.fail(
  new ProviderError({}, `Call ${i} failed`, { code: "MULTICALL_FAILED" })
);
```

But this is inside a `.map()`, so the throw is acceptable here since it bubbles up.

---

## AbiEncoder

### ✅ Effect Wrapping: Correct

**Location**: [DefaultAbiEncoder.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/AbiEncoder/DefaultAbiEncoder.ts)

```typescript
encodeFunction: (abi, functionName, args) =>
  Effect.try({
    try: () => { ... },
    catch: (error) => new AbiEncodeError({ ... })
  }),
```

Proper use of `Effect.try` to wrap synchronous operations that may throw.

### ✅ Error Types: Correct

- `AbiEncodeError`: function-specific context
- `AbiDecodeError`: data-specific context
- Both are `Data.TaggedError` with cause chain

### ⚠️ Minor: Any Casts

**Location**: [DefaultMulticall.ts#L85-86](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Multicall/DefaultMulticall.ts#L85-L86)

```typescript
// biome-ignore lint/suspicious/noExplicitAny: ABI encoding requires dynamic type casting
const encoded = encodeParameters(AGGREGATE3_INPUT_PARAMS as any, [tuples] as any);
```

Acceptable with documented biome-ignore, but could use branded ABI types for stricter typing.

### ❌ Missing Tests

No test files found for AbiEncoder. Review 071 mentioned this need.

---

## Summary of Issues

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| 🔴 Critical | Precision loss in baseFee multiplication | FeeEstimator | Use bigint-only math |
| 🟡 Medium | Missing FeeEstimator tests | - | Add test file |
| 🟡 Medium | Missing AbiEncoder tests | - | Add test file |
| 🟡 Medium | Missing Formatter tests | - | Add test file |
| 🟢 Low | Missing batch size chunking | Multicall | Add batchSize param |
| 🟢 Low | Low-level Multicall untested | Multicall | Add unit tests |

## Action Items

1. **Fix FeeEstimator precision loss** (Critical - review 044)
2. **Add FeeEstimator tests** covering:
   - Legacy and EIP-1559 modes
   - Large baseFee values (2^60)
   - Custom multipliers
3. **Add AbiEncoder tests** (review 071)
4. **Add Formatter tests** (basic passthrough verification)
5. **Consider batch size chunking** for large multicalls
