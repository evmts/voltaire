# Add JSON-RPC Ethereum-Specific Error Codes

## Problem

`Error.ts` is missing Ethereum-specific RPC error codes for EIP-1193 compliance.

**Location**: `src/jsonrpc/Error.ts`

Missing:
- `ACTION_REJECTED` (-32003)
- `CHAIN_DISCONNECTED` (-32000 range)
- `UNSUPPORTED_METHOD` (-32004)
- `RESOURCE_NOT_FOUND` (-32002)
- `LIMIT_EXCEEDED` (-32005)

## Why This Matters

- Incomplete EIP-1193 compliance
- Cannot discriminate wallet rejection from other errors
- User experience suffers (can't show "user rejected" message)

## Solution

Add Ethereum-specific error codes:

```typescript
// Standard JSON-RPC errors
export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

// Ethereum Provider errors (EIP-1193)
export const USER_REJECTED_REQUEST = 4001;
export const UNAUTHORIZED = 4100;
export const UNSUPPORTED_METHOD = 4200;
export const DISCONNECTED = 4900;
export const CHAIN_DISCONNECTED = 4901;

// Ethereum RPC errors (non-standard but common)
export const RESOURCE_NOT_FOUND = -32002;
export const RESOURCE_UNAVAILABLE = -32002;
export const TRANSACTION_REJECTED = -32003;
export const METHOD_NOT_SUPPORTED = -32004;
export const LIMIT_EXCEEDED = -32005;
export const JSON_RPC_VERSION_NOT_SUPPORTED = -32006;

// Error type with code discrimination
export class JsonRpcError extends Data.TaggedError("JsonRpcError")<{
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}> {
  get isUserRejected(): boolean {
    return this.code === USER_REJECTED_REQUEST;
  }
  
  get isDisconnected(): boolean {
    return this.code === DISCONNECTED || this.code === CHAIN_DISCONNECTED;
  }
}
```

## Acceptance Criteria

- [ ] Add EIP-1193 provider error codes
- [ ] Add common Ethereum RPC error codes
- [ ] Add helper methods for common checks
- [ ] Document error code meanings
- [ ] All existing tests pass

## Priority

**Low** - Completeness
