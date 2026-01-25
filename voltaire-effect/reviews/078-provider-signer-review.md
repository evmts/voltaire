# Provider & Signer Service Review

**Date**: 2026-01-25  
**Reviewer**: Claude  
**Files Reviewed**:
- `src/services/Provider/Provider.ts`
- `src/services/Provider/ProviderService.ts`
- `src/services/Provider/actions/` (multicall, readContract, simulateContract)
- `src/services/Signer/Signer.ts`
- `src/services/Signer/SignerService.ts`
- `src/services/Signer/actions/` (deployContract, writeContract)
- Test files for Provider and Signer

## Executive Summary

**Overall Assessment**: ✅ Good with minor improvements needed

The Provider and Signer implementations follow Effect patterns correctly. Prior issues (reviews 023, 025, 026) have all been fixed. The code demonstrates proper:
- Layer/Context composition
- Error typing and propagation
- Schedule-based retry logic
- Runtime capture for async callbacks

---

## Known Issues Verification

### ✅ Review 023: Provider runPromise in callback - **FIXED**

**Location**: `Provider.ts#L528-L541, L559-L572`

The implementation now correctly captures runtime and uses `Runtime.runPromise(runtime)`:

```typescript
const runtime = yield* Effect.runtime<never>();
const provider = {
  request: async ({ method, params }) =>
    Runtime.runPromise(runtime)(transport.request(method, params)),
  // ...
};
```

### ✅ Review 025: Provider manual remaining time - **FIXED**

**Location**: `Provider.ts#L357-L420`

The implementation now uses proper schedule composition:

```typescript
Effect.retry(
  Schedule.spaced(Duration.millis(pollingInterval)).pipe(
    Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
    Schedule.whileInput((e: ProviderError) => e.code === INTERNAL_CODE_PENDING),
  ),
),
Effect.timeoutFail({
  duration: Duration.millis(timeout),
  onTimeout: () => new ProviderError(...),
})
```

### ✅ Review 026: Signer string message retry - **FIXED**

**Location**: `Signer.ts#L55, L550-L578`

Uses internal error code instead of string matching:

```typescript
const INTERNAL_CODE_BUNDLE_PENDING = -40003;

// In waitForCallsStatus:
Effect.fail(new SignerError({ bundleId }, "Bundle still pending", {
  code: INTERNAL_CODE_BUNDLE_PENDING,
}))

// Retry condition:
Schedule.whileInput((e: SignerError) => e.code === INTERNAL_CODE_BUNDLE_PENDING)
```

---

## Effect Patterns Assessment

### ✅ No runPromise in Callbacks

All async interop correctly captures runtime first.

### ✅ Proper Error Typing

- `ProviderError` and `SignerError` extend `AbstractError`
- Error codes are propagated from transport layer
- `cause` chain is preserved

### ✅ Service Composition

```typescript
// Provider layer only needs TransportService
export const Provider: Layer.Layer<ProviderService, never, TransportService>

// Signer layer composes properly
const SignerLive: Layer.Layer<
  SignerService,
  never,
  AccountService | ProviderService | TransportService
>
```

### ✅ Layer Helpers

`Signer.fromProvider` and `Signer.fromPrivateKey` correctly compose layers.

---

## Issues Found

### 1. Minor: Internal Error Codes Not Exported

**Location**: `Provider.ts#L40-41`, `Signer.ts#L55`

Internal codes are defined but not exported for testing purposes:

```typescript
const INTERNAL_CODE_PENDING = -40001;
const INTERNAL_CODE_WAITING_CONFIRMATIONS = -40002;
const INTERNAL_CODE_BUNDLE_PENDING = -40003;
```

**Recommendation**: These should be documented in the service files or exported for test utilities.

**Priority**: Low

---

### 2. Minor: simulateContract Missing stateOverride Support

**Location**: `simulateContract.ts#L147`

The `stateOverride` parameter is defined in the interface but not passed to `provider.call`:

```typescript
export interface SimulateContractParams<...> {
  // ...
  readonly stateOverride?: readonly StateOverride[];  // Defined
}

// But not used:
const rawResult = yield* provider.call(callRequest, params.blockTag);
// stateOverride is ignored!
```

**Recommendation**: Either implement state override support or remove from interface to avoid confusion.

**Priority**: Medium - API promises something it doesn't deliver

---

### 3. Minor: multicall Error Handling Inconsistency

**Location**: `multicall.ts#L143`

When `allowFailure=false`, errors are thrown rather than returned as Effect failures:

```typescript
if (!r.success) {
  if (allowFailure) {
    return { status: "failure" as const, error: new Error("Call reverted") };
  }
  throw new Error(`Call ${i} failed`);  // Throws instead of Effect.fail
}
```

**Recommendation**: Use `yield* Effect.fail(...)` instead of throw:

```typescript
if (!r.success && !allowFailure) {
  return yield* Effect.fail(
    new ProviderError({ index: i, contract }, `Call ${i} failed`)
  );
}
```

**Priority**: Medium - Inconsistent error handling

---

### 4. Minor: deployContract Returns Lazy Effect in Result

**Location**: `deployContract.ts#L141-151`

The `address` field is an Effect that must be run separately:

```typescript
export interface DeployContractResult {
  readonly hash: HashType;
  readonly address: Effect.Effect<AddressType, ProviderError, ProviderService>;
}
```

This is intentional but unusual. Consider documenting why or providing a `waitForDeployment` helper.

**Priority**: Low - Design decision, just needs documentation

---

### 5. Missing: Timeout Tests for waitForTransactionReceipt

**Location**: `Provider.test.ts`

No tests verify timeout behavior for `waitForTransactionReceipt`. The retry logic is complex enough to warrant coverage.

**Priority**: Medium

---

### 6. Minor: formatCallRequest Incomplete

**Location**: `Provider.ts#L116-124`

`formatCallRequest` doesn't handle all EIP-1559 fields:

```typescript
const formatCallRequest = (tx: CallRequest): RpcCallObject => {
  // Missing: gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce
  if (tx.from) formatted.from = ...;
  if (tx.to) formatted.to = ...;
  if (tx.data) formatted.data = ...;
  if (tx.value !== undefined) formatted.value = ...;
  if (tx.gas !== undefined) formatted.gas = ...;
  // That's it!
};
```

**Recommendation**: Add missing fields to `CallRequest` interface and formatter, or document that these are intentionally excluded for simulation calls.

**Priority**: Low

---

## Test Coverage Assessment

### Provider Tests ✅ Good

- Block number conversion
- Balance queries with branded types
- Block fetching by tag and hash
- Log filtering (topics, wildcards, arrays)
- Fee history validation
- Error code propagation
- Transaction receipt and confirmation logic

### Signer Tests ✅ Good

- Message signing
- Transaction signing and sending
- Layer composition helpers
- Transaction type detection (EIP-2930, EIP-1559, EIP-4844, EIP-7702)
- EIP-5792 wallet methods (sendCalls, getCallsStatus, waitForCallsStatus)

### Missing Tests

1. **Provider**: `waitForTransactionReceipt` timeout scenarios
2. **Provider**: `watchBlocks` and `backfillBlocks` error handling
3. **Signer**: `switchChain` error scenarios
4. **Actions**: `multicall` with `allowFailure=false`
5. **Actions**: `simulateContract` result decoding

---

## Recommendations

### High Priority

None - core functionality is solid.

### Medium Priority

1. Fix `multicall` to use `Effect.fail` instead of `throw`
2. Either implement `stateOverride` in simulateContract or remove from types
3. Add timeout tests for `waitForTransactionReceipt`

### Low Priority

1. Document or export internal error codes
2. Add JSDoc noting `deployContract.address` is lazy
3. Add missing CallRequest fields to formatter

---

## Summary

| Category | Status |
|----------|--------|
| Effect patterns | ✅ Correct |
| Error typing | ✅ Correct |
| Layer composition | ✅ Correct |
| Transaction handling | ✅ Correct |
| Prior issues (023, 025, 026) | ✅ All fixed |
| Test coverage | ⚠️ Good, some gaps |
| Minor issues | ⚠️ 3 medium, 3 low |

**Verdict**: Production-ready with minor improvements recommended.
