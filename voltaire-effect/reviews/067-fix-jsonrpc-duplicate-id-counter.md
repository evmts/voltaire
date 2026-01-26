# Fix JSON-RPC Duplicate idCounter

**Updated**: 2026-01-26  
**Status**: Open (multiple counters still exist)

## Problem

Multiple JSON-RPC namespace modules still have separate `idCounter` variables, which can collide once each namespace exceeds its local range.

**Locations (current)**:
- `voltaire-effect/src/jsonrpc/Request.ts` (idCounter = 0)
- `voltaire-effect/src/jsonrpc/Eth.ts` (idCounter = 1000)
- `voltaire-effect/src/jsonrpc/Wallet.ts` (idCounter = 2000)
- `voltaire-effect/src/jsonrpc/Net.ts` (idCounter = 3000)
- `voltaire-effect/src/jsonrpc/Web3.ts` (idCounter = 4000)
- `voltaire-effect/src/jsonrpc/Txpool.ts` (idCounter = 5000)
- `voltaire-effect/src/jsonrpc/Anvil.ts` (idCounter = 6000)
- `voltaire-effect/src/jsonrpc/Hardhat.ts` (idCounter = 7000)

```typescript
// Example (Eth.ts)
let idCounter = 1000;

// Request.ts
let idCounter = 0;
```

## Why This Matters

- Two counters can generate same IDs
- Response matching could fail
- Debugging confusion

## Solution

Consolidate to single source in `Request.ts`:

```typescript
// Request.ts - single source of truth
let idCounter = 0;

export const nextId = (): number => ++idCounter;

export const createRequest = <P>(method: string, params: P): JsonRpcRequest<P> => ({
  jsonrpc: "2.0",
  id: nextId(),
  method,
  params,
});
```

Then use in Eth.ts:

```typescript
// Eth.ts
import { nextId, createRequest } from "./Request";

// Remove local idCounter
```

## Acceptance Criteria

- [ ] Remove duplicate `idCounter` from each namespace module
- [ ] Export `nextId` (or `makeId`) from `Request.ts`
- [ ] Update Eth/Wallet/Net/Web3/Txpool/Anvil/Hardhat to use shared counter
- [ ] All existing tests pass

## Priority

**Low** - Code organization
