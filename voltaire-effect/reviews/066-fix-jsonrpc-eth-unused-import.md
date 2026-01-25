# Fix JSON-RPC Eth.ts Unused Import

## Problem

`Eth.ts` imports `eth` but never uses it.

**Location**: `src/jsonrpc/Eth.ts#L1`

```typescript
import { eth } from "...";  // Unused!
```

## Why This Matters

- Dead code
- Increases bundle size
- Confusing for readers
- Lint warning

## Solution

Remove unused import:

```typescript
// Remove the line:
// import { eth } from "...";
```

Or if it was intended to be used, add usage.

## Acceptance Criteria

- [ ] Remove unused `eth` import
- [ ] Verify no runtime breakage
- [ ] All existing tests pass

## Priority

**Low** - Code cleanup
