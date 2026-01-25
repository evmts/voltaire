# Fix Missing Bytes Module Exports

## Problem

Bytes module has utility functions (`equals`, `concat`, `size`, `toString`) implemented but not exported from the index.

**Location**: `src/primitives/Bytes/index.ts`

Files exist:
- `src/primitives/Bytes/equals.ts`
- `src/primitives/Bytes/concat.ts`
- `src/primitives/Bytes/size.ts`
- `src/primitives/Bytes/toString.ts`

But may not be re-exported from `index.ts`.

## Why This Matters

- Useful utilities hidden from consumers
- Inconsistent module API
- Users must import from deep paths

## Solution

Ensure all utilities are exported:

```typescript
// src/primitives/Bytes/index.ts
export { equals } from "./equals";
export { concat } from "./concat";
export { size } from "./size";
export { toString } from "./toString";
export { random } from "./random";
export { isBytes } from "./isBytes";
export { fromHex, toHex } from "./Hex";

// Re-export type
export type { BytesType } from "./BytesType";
```

Verify with:
```typescript
import * as Bytes from "voltaire-effect/primitives/Bytes";

Bytes.equals(a, b);  // Should work
Bytes.concat([a, b]);  // Should work
Bytes.size(data);  // Should work
```

## Acceptance Criteria

- [ ] Export `equals` from index
- [ ] Export `concat` from index
- [ ] Export `size` from index
- [ ] Export `toString` from index
- [ ] All utilities accessible via `Bytes.*`
- [ ] All existing tests pass

## Priority

**Medium** - API completeness
