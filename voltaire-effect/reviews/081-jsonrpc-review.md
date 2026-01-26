# Review 081: JSON-RPC Module

**Date**: 2026-01-25 (review)  
**Updated**: 2026-01-26  
**Module**: `voltaire-effect/src/jsonrpc/`  
**Reviewer**: Claude  

## Summary

The JSON-RPC module provides typed request/response handling for Ethereum RPC methods. Overall structure is good but has several issues requiring attention.

### Update (2026-01-26)

- ✅ **Unused import fixed** in `Eth.ts` (review 066 resolved).
- ⚠️ **Duplicate ID counters** remain across namespace files (see issue 067).
- ⚠️ **EIP-1193 provider error codes** are still missing from `Error.ts`.
- ⚠️ **Response validation** and **notification semantics** unchanged.

## Critical Issues

### 1. Unused Import (Known Issue 066)

**Status**: ✅ Resolved (2026-01-26)  
**File**: `voltaire-effect/src/jsonrpc/Eth.ts`

Unused import removed.

### 2. Duplicate ID Counters (Known Issue 067) - HIGH SEVERITY

**Problem**: Each namespace file has its own `idCounter` with different starting values:
**Current (2026-01-26)**:
- `Request.ts`: 0
- `Eth.ts`: 1000
- `Wallet.ts`: 2000
- `Net.ts`: 3000
- `Web3.ts`: 4000
- `Txpool.ts`: 5000
- `Anvil.ts`: 6000
- `Hardhat.ts`: 7000

**Risk**: While the different starting ranges prevent immediate collisions, this pattern:
1. Creates maintenance burden
2. Will collide after ~1000 requests per namespace in same process
3. Not thread-safe (concurrent calls can race)

**Recommendation**: Centralize ID generation in `Request.ts`:

```typescript
// Request.ts
let globalIdCounter = 0;
export function nextId(): number {
  return ++globalIdCounter;
}
```

Or use UUIDs/crypto.randomUUID() for true uniqueness.

### 3. Missing Ethereum Error Codes (Known Issue 068)

**File**: [Error.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/Error.ts#L24-L35)

**Present Codes** (2026-01-26):
- Standard JSON-RPC: -32700 to -32603 ✓
- Server error codes: -32000 to -32006 ✓ (`INVALID_INPUT`, `RESOURCE_NOT_FOUND`, etc.)

**Still Missing**:
```typescript
// Common node-specific
export const EXECUTION_REVERTED = 3;
export const INSUFFICIENT_FUNDS = -32010;

// EIP-1193 Provider Errors  
export const USER_REJECTED_REQUEST = 4001;
export const UNAUTHORIZED = 4100;
export const UNSUPPORTED_METHOD = 4200;
export const DISCONNECTED = 4900;
export const CHAIN_DISCONNECTED = 4901;

// Server errors
export const SERVER_ERROR_MIN = -32099;
export const SERVER_ERROR_MAX = -32000;
```

## Medium Issues

### 4. Weak Response Validation

**File**: [Response.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/Response.ts#L22-L33)

The `from()` function only checks for object and `jsonrpc: "2.0"`. It doesn't validate:
- `id` field presence/type
- Mutually exclusive `result` and `error` fields
- `error` object structure

**Recommendation**:
```typescript
export function from<TResult = unknown>(raw: unknown): JsonRpcResponseType<TResult> {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid JSON-RPC response: not an object");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.jsonrpc !== "2.0") {
    throw new Error("Invalid JSON-RPC response: missing jsonrpc field");
  }
  if (!("id" in obj)) {
    throw new Error("Invalid JSON-RPC response: missing id field");
  }
  if ("result" in obj && "error" in obj) {
    throw new Error("Invalid JSON-RPC response: both result and error present");
  }
  if (!("result" in obj) && !("error" in obj)) {
    throw new Error("Invalid JSON-RPC response: neither result nor error present");
  }
  return raw as JsonRpcResponseType<TResult>;
}
```

### 5. BatchResponse.from() Has No Validation

**File**: [BatchResponse.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/BatchResponse.ts#L12-L14)

```typescript
export function from(raw: unknown[]): BatchResponseType {
  return raw as BatchResponseType; // No validation!
}
```

Should validate each response in the array.

### 6. Notification Handling Incomplete

**File**: [Request.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/Request.ts#L25-L27)

`isNotification` treats `null` as notification but JSON-RPC 2.0 spec says notifications have NO id field (not `null` id). A `null` id is valid for responses to requests with `null` id.

```typescript
// Current (incorrect)
export function isNotification(request: JsonRpcRequestType): boolean {
  return request.id === undefined || request.id === null;
}

// Correct
export function isNotification(request: JsonRpcRequestType): boolean {
  return request.id === undefined;
}
```

## Minor Issues

### 7. Inconsistent Parameter Types

**File**: [Eth.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/Eth.ts)

Some functions use `unknown` for transaction objects when they could use typed interfaces:
- `CallRequest(tx: unknown, ...)` 
- `EstimateGasRequest(tx: unknown)`
- `NewFilterRequest(filter: unknown)`

**Recommendation**: Import and use proper types from primitives.

### 8. biome-ignore for `toString`

**File**: [Error.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/Error.ts#L19-L20)

```typescript
// biome-ignore lint/suspicious/noShadowRestrictedNames: Intentional API design
export function toString(error: JsonRpcErrorType): string {
```

Consider renaming to `format` or `stringify` to avoid shadowning built-in.

### 9. Test Coverage Gaps

**File**: [JsonRpc.test.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/jsonrpc/JsonRpc.test.ts)

Missing tests:
- Anvil namespace methods
- Hardhat namespace methods  
- ID uniqueness across namespaces
- Batch request with mixed notifications
- Response with `null` id
- Large batch handling

## Type Safety Assessment

| Area | Status | Notes |
|------|--------|-------|
| Request types | ✓ Good | Proper readonly types |
| Response types | ⚠️ Fair | Missing discriminated union refinement |
| Error types | ✓ Good | Proper structure |
| Eth methods | ⚠️ Fair | Too many `unknown` params |
| ID types | ✓ Good | Union of number/string/null |

## Recommendations Summary

| Priority | Issue | Action |
|----------|-------|--------|
| P0 | Unused import | Remove line 1 in Eth.ts |
| P0 | Duplicate ID counters | Centralize in Request.ts |
| P1 | Missing error codes | Add EIP-1193 and common node codes |
| P1 | Weak response validation | Add proper validation |
| P2 | Notification semantics | Fix `null` vs `undefined` |
| P2 | Type unknown params | Add proper Ethereum types |
| P3 | Test coverage | Add missing namespace tests |

## Files Changed

None - review only.
