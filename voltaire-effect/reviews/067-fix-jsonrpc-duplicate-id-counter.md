# Fix JSON-RPC Duplicate idCounter

## Problem

Both `Eth.ts` and `Request.ts` have separate `idCounter` variables, which could cause ID collisions.

**Locations**:
- `src/jsonrpc/Eth.ts#L4`
- `src/jsonrpc/Request.ts#L10`

```typescript
// Eth.ts
let idCounter = 0;

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

- [ ] Remove duplicate `idCounter` from Eth.ts
- [ ] Export `nextId` from Request.ts
- [ ] Update all usages to use shared counter
- [ ] All existing tests pass

## Priority

**Low** - Code organization
