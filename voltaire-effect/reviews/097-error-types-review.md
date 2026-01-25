# Review 097: Error Types and Error Handling Patterns

**Date**: 2026-01-25  
**Reviewer**: AI Code Review  
**Status**: ⚠️ Mixed - Good foundation with issues to address

## Summary

The error handling system shows good Effect integration with `_tag` discriminants and AbstractError inheritance. However, there's inconsistency between approaches (class-based vs Data.TaggedError) and missing retry hints.

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| TransportError.ts | ✅ Good | Complete implementation with JSON-RPC codes |
| BlockStreamError.ts | ⚠️ Basic | Missing error codes, context |
| EventStreamError.ts | ⚠️ Basic | Missing error codes, context |
| TransactionStreamError.ts | ⚠️ Basic | Missing error codes, context |
| BlockError.ts | ✅ Good | Has BlockNotFoundError subtype |
| standards/errors.ts | ⚠️ Inconsistent | Uses Data.TaggedError (different pattern) |
| services/errors.test.ts | ✅ Good | Comprehensive error shape tests |
| index.ts exports | ⚠️ Incomplete | Missing some error exports |

---

## 1. Data.TaggedError Usage Consistency

**Issue**: Mixed patterns - most errors extend `AbstractError`, but `StandardsError` uses `Data.TaggedError`.

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

**Recommendation**: Standardize on AbstractError pattern for consistency. Data.TaggedError is simpler but lacks:
- JSON-RPC error codes
- `docsPath` for documentation links
- `getErrorChain()` for debugging
- `toJSON()` for telemetry

**Action**: Refactor `StandardsError` to extend AbstractError:
```typescript
export class StandardsError extends AbstractError {
  readonly _tag = "StandardsError" as const;
  readonly operation: string;
  
  constructor(operation: string, message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = "StandardsError";
    this.operation = operation;
  }
}
```

---

## 2. Error Codes: Uniqueness and Documentation

**Issue**: Error codes not consistently defined across all errors.

| Error Type | Has Code? | Default |
|------------|-----------|---------|
| TransportError | ✅ Yes | From JSON-RPC input |
| ProviderError | ✅ Yes | -32000 (via options) |
| ContractError | ✅ Yes | -32000 (via options) |
| BlockStreamError | ❌ No | -32000 (AbstractError default) |
| EventStreamError | ❌ No | -32000 (AbstractError default) |
| TransactionStreamError | ❌ No | -32000 (AbstractError default) |
| BlockError | ❌ No | -32000 (AbstractError default) |
| StandardsError | ❌ No | N/A (different pattern) |

**Documented JSON-RPC codes** (in TransportError.ts):
- -32700: Parse error
- -32600: Invalid request
- -32601: Method not found
- -32602: Invalid params
- -32603: Internal error
- -32000 to -32099: Server errors

**Recommendation**: Define unique error codes for each domain:
```typescript
// Suggested code ranges:
// -33000 to -33099: Block stream errors
// -33100 to -33199: Event stream errors
// -33200 to -33299: Transaction stream errors
```

---

## 3. Error Messages: Quality Check

**✅ Good practices observed**:
- Messages are informative and actionable
- No sensitive data (keys, secrets) in error messages
- `BlockNotFoundError` includes identifier in message

**⚠️ Could improve**:
- Stream errors have generic messages (just pass-through from constructor)
- No structured error message format

**Example of good message** (BlockNotFoundError):
```typescript
`Block ${typeof identifier === "bigint" ? identifier.toString() : identifier} not found`
```

---

## 4. Error Cause Chaining

**✅ Working correctly**:
- AbstractError properly chains causes
- `getErrorChain()` traverses cause chain
- Tests verify cause propagation

**Code flow**:
```
TransportError → ProviderError → SignerError
     ↑              ↑               ↑
   (cause)       (cause)        (cause)
```

**Test coverage** (from errors.test.ts):
```typescript
// Verified: Code propagates through error chain
expect((signerError.cause as ProviderError).cause as TransportError).code).toBe(-32601);
```

---

## 5. Retry Hints: MISSING

**Critical gap**: No errors indicate whether they're retryable.

**Current retry behavior** (scattered):
- `HttpTransport`: Has `retries` and `retryDelay` options
- `FallbackTransport`: Has `retryCount` option
- `fetchBlock`: Uses `RetryOptions` with exponential backoff

**Missing**: Error types don't carry retry metadata.

**Recommendation**: Add `retryable` property to AbstractError:
```typescript
export abstract class AbstractError extends Error {
  // ... existing properties
  
  /**
   * Whether this error is transient and operation should be retried.
   * @example Network timeout → true, Invalid address → false
   */
  retryable?: boolean;
}
```

**Retryability guide**:
| Error | Retryable? | Reason |
|-------|------------|--------|
| TransportError (-32603) | ✅ Yes | Internal/network error |
| TransportError (-32601) | ❌ No | Method not found |
| TransportError (-32602) | ❌ No | Invalid params |
| BlockNotFoundError | ⚠️ Maybe | Block may appear later |
| Rate limit errors | ✅ Yes | After delay |

---

## 6. Schema Parse Errors: ParseResult Usage

**✅ Proper usage** in primitives:
```typescript
// Correct pattern (from Uint32Schema.ts)
try {
  return ParseResult.succeed(BrandedUint32.from(value));
} catch (e) {
  return ParseResult.fail(
    new ParseResult.Type(ast, value, (e as Error).message),
  );
}
```

**Coverage**: Found in 30+ schema files using ParseResult correctly.

**Special cases**:
- `AbiParseError` - custom error for ABI parsing
- `JsonRpcParseError` - custom error for JSON-RPC response parsing

---

## 7. Export Completeness

**From `voltaire-effect/src/index.ts`**:

| Export | Status |
|--------|--------|
| AbstractError | ✅ Exported |
| TransportError | ✅ (via services) |
| ProviderError | ✅ (via services) |
| BlockStreamError | ✅ (via services) |
| EventStreamError | ✅ Exported |
| TransactionStreamError | ✅ (via services) |
| BlockError | ❌ **MISSING** |
| BlockNotFoundError | ❌ **MISSING** |
| StandardsError | ✅ Exported |
| AbiParseError | ❌ **MISSING** |

**Missing exports to add**:
```typescript
// In src/index.ts
export { BlockError, BlockNotFoundError } from "./block/BlockError.js";
export { AbiParseError } from "./primitives/Abi/parse.js";
```

---

## Action Items

### P0 (Critical)
1. **Export missing errors** - BlockError, BlockNotFoundError, AbiParseError
2. **Add retryable hints** - Critical for proper retry handling

### P1 (Important)  
3. **Standardize on AbstractError** - Refactor StandardsError
4. **Define error codes** - Unique codes for stream errors

### P2 (Nice to have)
5. **Document error codes** - Central registry of all codes
6. **Add docsPath** - Link errors to documentation

---

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
        └── (20+ validation/crypto errors...)

Data.TaggedError (INCONSISTENT)
  └── StandardsError
```

---

## Test Coverage

**errors.test.ts** covers:
- ✅ Constructor standardization (all errors have _tag, input, message, cause)
- ✅ Error without cause
- ✅ instanceof checks
- ✅ Message defaults
- ✅ Error code propagation through layers

**Missing test coverage**:
- BlockError / BlockNotFoundError
- EventStreamError
- StandardsError
- AbiParseError
- JsonRpcParseError
