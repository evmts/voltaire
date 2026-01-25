# Review 097: Error Types and Error Handling Patterns

<issue>
<metadata>
priority: P1
files: [
  "voltaire-effect/src/services/Transport/TransportError.ts",
  "voltaire-effect/src/services/Provider/ProviderError.ts",
  "voltaire-effect/src/services/Signer/SignerError.ts",
  "voltaire-effect/src/services/Contract/ContractError.ts",
  "voltaire-effect/src/block/BlockError.ts",
  "voltaire-effect/src/stream/BlockStreamError.ts",
  "voltaire-effect/src/stream/EventStreamError.ts",
  "voltaire-effect/src/stream/TransactionStreamError.ts",
  "voltaire-effect/src/standards/errors.ts",
  "voltaire-effect/src/AbstractError.ts",
  "voltaire-effect/src/services/errors.test.ts",
  "voltaire-effect/src/index.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
Error handling system using Effect-integrated `_tag` discriminants and AbstractError inheritance. Provides typed error channels, cause chaining, JSON-RPC error codes, and structured error messages for the entire voltaire-effect library.
</purpose>
<current_status>
**GOOD FOUNDATION with issues**. AbstractError pattern is well-designed with `_tag` discriminants, cause chaining via `getErrorChain()`, and JSON-RPC code support. However, there's **inconsistency** between class-based errors (AbstractError) and Data.TaggedError (StandardsError), **missing retry hints**, and **incomplete exports**.
</current_status>
</module_overview>

<findings>
<critical>
### 1. Missing Error Exports (P0)

**Location**: `src/index.ts`

Several error types exist but are not exported from the main index:

| Error Type | Exists | Exported |
|------------|--------|----------|
| AbstractError | ✅ | ✅ |
| TransportError | ✅ | ✅ (via services) |
| ProviderError | ✅ | ✅ (via services) |
| BlockError | ✅ | ❌ **MISSING** |
| BlockNotFoundError | ✅ | ❌ **MISSING** |
| AbiParseError | ✅ | ❌ **MISSING** |
| JsonRpcParseError | ✅ | ❌ **MISSING** |

**Impact**: Consumers cannot catch specific error types without importing internal paths.

### 2. Missing Retryable Hints (P0)

**Location**: All error types

No errors indicate whether they're retryable, forcing consumers to implement ad-hoc retry logic.

**Current retry behavior** (scattered, not type-aware):
- `HttpTransport`: Has `retries` and `retryDelay` options
- `FallbackTransport`: Has `retryCount` option
- `fetchBlock`: Uses `RetryOptions` with exponential backoff

**Missing**: Error types don't carry retry metadata.

</critical>
<high>
### 3. Inconsistent Error Patterns (P1)

**Location**: `standards/errors.ts` vs others

Most errors extend `AbstractError`, but `StandardsError` uses `Data.TaggedError`:

```typescript
// AbstractError pattern (most errors)
export class TransportError extends AbstractError {
  readonly _tag = "TransportError" as const;
}

// Data.TaggedError pattern (standards/errors.ts)
export class StandardsError extends Data.TaggedError("StandardsError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

**Impact**: `StandardsError` lacks JSON-RPC codes, `docsPath`, `getErrorChain()`, and `toJSON()`.

### 4. Stream Errors Missing Error Codes (P1)

**Location**: `BlockStreamError.ts`, `EventStreamError.ts`, `TransactionStreamError.ts`

| Error Type | Has Code? | Default |
|------------|-----------|---------|
| TransportError | ✅ Yes | From JSON-RPC input |
| ProviderError | ✅ Yes | -32000 (via options) |
| BlockStreamError | ❌ No | -32000 (AbstractError default) |
| EventStreamError | ❌ No | -32000 (AbstractError default) |
| TransactionStreamError | ❌ No | -32000 (AbstractError default) |

</high>
<medium>
### 5. Missing Test Coverage for Several Error Types (P2)

**Tested in errors.test.ts**:
- ✅ TransportError, ProviderError, ContractError, SignerError
- ✅ Error cause chaining
- ✅ Error code propagation

**Not tested**:
- ❌ BlockError / BlockNotFoundError
- ❌ EventStreamError
- ❌ StandardsError
- ❌ AbiParseError
- ❌ JsonRpcParseError

### 6. Error Codes Not Documented (P2)

JSON-RPC standard codes documented in TransportError.ts but:
- No central registry of all custom codes
- Stream errors have no defined code ranges
- Easy to accidentally reuse codes

</medium>
</findings>

<effect_improvements>
### Add Retryable Property to AbstractError

```typescript
export abstract class AbstractError extends Error {
  // ... existing properties
  
  /**
   * Whether this error is transient and operation should be retried.
   * @example Network timeout → true, Invalid address → false
   */
  readonly retryable: boolean = false;
}

// Usage
export class TransportTimeoutError extends AbstractError {
  readonly _tag = "TransportTimeoutError" as const;
  readonly retryable = true;  // Transient, can retry
}

export class InvalidAddressError extends AbstractError {
  readonly _tag = "InvalidAddressError" as const;
  readonly retryable = false;  // Permanent, don't retry
}
```

### Refactor StandardsError to AbstractError

```typescript
export class StandardsError extends AbstractError {
  readonly _tag = "StandardsError" as const;
  readonly operation: string;
  readonly code = -33000;  // Define dedicated range
  
  constructor(operation: string, message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = "StandardsError";
    this.operation = operation;
  }
}
```

### Define Error Code Ranges

```typescript
// error-codes.ts
export const ErrorCodeRanges = {
  // JSON-RPC Standard
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_RANGE: [-32000, -32099],
  
  // voltaire-effect Custom
  BLOCK_STREAM_RANGE: [-33000, -33099],
  EVENT_STREAM_RANGE: [-33100, -33199],
  TRANSACTION_STREAM_RANGE: [-33200, -33299],
  STANDARDS_RANGE: [-33300, -33399],
  ABI_PARSE_RANGE: [-33400, -33499],
} as const;
```

### Add Missing Exports

```typescript
// In src/index.ts
export { BlockError, BlockNotFoundError } from "./block/BlockError.js";
export { AbiParseError } from "./primitives/Abi/parse.js";
export { JsonRpcParseError } from "./jsonrpc/errors.js";
```
</effect_improvements>

<viem_comparison>
**viem Error Approach**:
- Uses `BaseError` class with similar `_tag` pattern
- Has `shortMessage`, `details`, `docsPath` properties
- Defines typed errors for each operation
- No retry hints (same gap)

**voltaire-effect Advantages**:
- Effect integration with typed error channels
- `getErrorChain()` for debugging
- `toJSON()` for telemetry
- JSON-RPC code tracking

**voltaire-effect Gaps**:
- Inconsistent Data.TaggedError usage
- Missing retryable metadata
- Incomplete exports
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Export missing errors from index.ts** - BlockError, BlockNotFoundError, AbiParseError
2. **Add retryable property to AbstractError** - Boolean flag with sensible defaults
3. **Refactor StandardsError** - Extend AbstractError instead of Data.TaggedError
4. **Define error code ranges** - Central registry for all custom codes
5. **Add codes to stream errors** - BlockStreamError: -33000, etc.
6. **Add docsPath to errors** - Link to documentation for common errors
7. **Add tests for untested errors** - Complete coverage
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Retryable error classification
const isRetryable = (error: AbstractError): boolean => {
  return error.retryable ?? (
    error.code >= -32099 && error.code <= -32000  // Server errors usually retryable
  );
};

// Pattern: Error with retry policy
export class RateLimitError extends AbstractError {
  readonly _tag = "RateLimitError" as const;
  readonly retryable = true;
  readonly retryAfterMs: number;
  
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.retryAfterMs = retryAfterMs;
  }
}

// Pattern: Effect retry based on error type
const withSmartRetry = <A, E extends AbstractError, R>(
  effect: Effect.Effect<A, E, R>
) =>
  effect.pipe(
    Effect.retry({
      while: (error) => error.retryable,
      times: 3,
      schedule: Schedule.exponential("1 second"),
    })
  );
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- BlockError construction and properties
- BlockNotFoundError with different identifier types
- EventStreamError basic functionality
- StandardsError operation field
- AbiParseError with malformed ABI
- JsonRpcParseError with various responses
- Retryable classification
- Error code ranges don't overlap
- getErrorChain with deep nesting
- toJSON serialization format
</missing_coverage>
<test_code>
```typescript
import { describe, expect, it } from "vitest";
import {
  AbstractError,
  TransportError,
  BlockError,
  BlockNotFoundError,
} from "../index.js";

describe("BlockError", () => {
  it("has correct _tag", () => {
    const error = new BlockError("Block fetch failed");
    expect(error._tag).toBe("BlockError");
  });
});

describe("BlockNotFoundError", () => {
  it("includes block number in message", () => {
    const error = new BlockNotFoundError(12345n);
    expect(error.message).toContain("12345");
  });

  it("includes block hash in message", () => {
    const hash = "0xabc123";
    const error = new BlockNotFoundError(hash);
    expect(error.message).toContain(hash);
  });
});

describe("retryable classification", () => {
  it("timeout errors are retryable", () => {
    const error = new TransportError("Timeout", { retryable: true });
    expect(error.retryable).toBe(true);
  });

  it("invalid param errors are not retryable", () => {
    const error = new TransportError("Invalid params", {
      code: -32602,
      retryable: false,
    });
    expect(error.retryable).toBe(false);
  });
});

describe("error code ranges", () => {
  it("stream error codes don't overlap", () => {
    const blockStream = -33000;
    const eventStream = -33100;
    const txStream = -33200;
    expect(blockStream).not.toBeInRange(eventStream - 99, eventStream);
    expect(eventStream).not.toBeInRange(txStream - 99, txStream);
  });
});
```
</test_code>
</tests>

<docs>
- Document all error types and their purpose
- Add error handling guide with examples
- Document error code ranges and conventions
- Add retry policy recommendations per error type
</docs>

<api>
<changes>
1. `AbstractError` - Add `retryable?: boolean` property
2. `StandardsError` - Refactor to extend AbstractError
3. `BlockStreamError` - Add `code = -33000`
4. `EventStreamError` - Add `code = -33100`
5. `TransactionStreamError` - Add `code = -33200`
6. Export: `BlockError`, `BlockNotFoundError`, `AbiParseError`
7. New: `ErrorCodeRanges` constant export
8. New: `isRetryable(error)` helper function
</changes>
</api>

<references>
- [JSON-RPC 2.0 Error Codes](https://www.jsonrpc.org/specification#error_object)
- [Effect Error Handling](https://effect.website/docs/error-management/expected-errors)
- [viem BaseError](https://github.com/wevm/viem/blob/main/src/errors/base.ts)
- [AbstractError implementation](file:///Users/williamcory/voltaire/voltaire-effect/src/AbstractError.ts)
</references>
</issue>

## Error Inheritance Diagram

```
Error
  └── AbstractError
        ├── TransportError
        ├── ProviderError
        ├── AccountError
        ├── SignerError
        ├── ContractError
        │     ├── ContractCallError
        │     ├── ContractWriteError
        │     └── ContractEventError
        ├── BlockError
        │     └── BlockNotFoundError
        ├── BlockStreamError
        ├── EventStreamError
        ├── TransactionStreamError
        ├── AbiParseError
        ├── JsonRpcParseError
        └── (20+ validation/crypto errors...)

Data.TaggedError (TO REFACTOR)
  └── StandardsError → Should extend AbstractError
```

## Retryability Guide

| Error | Retryable? | Reason |
|-------|------------|--------|
| TransportError (-32603) | ✅ Yes | Internal/network error |
| TransportError (-32601) | ❌ No | Method not found |
| TransportError (-32602) | ❌ No | Invalid params |
| BlockNotFoundError | ⚠️ Maybe | Block may appear later |
| RateLimitError | ✅ Yes | After delay |
| TimeoutError | ✅ Yes | Transient |
| InvalidAddressError | ❌ No | Permanent |
| InsufficientFundsError | ❌ No | Requires user action |
