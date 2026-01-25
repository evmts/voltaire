# Fix Duplicate AddressTypeSchema Declarations

## Problem

`AddressTypeSchema` is declared 3 times in the Address module, which is redundant and could lead to inconsistencies.

**Location**: `src/primitives/Address/` - multiple files define the same schema

## Why This Matters

- DRY violation
- Risk of schemas diverging
- Increased bundle size
- Maintenance burden

## Solution

Consolidate to single definition:

```typescript
// src/primitives/Address/AddressSchema.ts
import * as Schema from "effect/Schema";

export const AddressTypeSchema = Schema.Uint8ArrayFromSelf.pipe(
  Schema.filter((bytes) => bytes.length === 20, {
    message: () => "Address must be exactly 20 bytes",
  }),
  Schema.brand("Address")
);

export type AddressType = Schema.Schema.Type<typeof AddressTypeSchema>;
```

Then import everywhere:

```typescript
// src/primitives/Address/Hex.ts
import { AddressTypeSchema, AddressType } from "./AddressSchema";

// src/primitives/Address/Bytes.ts
import { AddressTypeSchema, AddressType } from "./AddressSchema";

// src/primitives/Address/index.ts
export { AddressTypeSchema, type AddressType } from "./AddressSchema";
```

## Acceptance Criteria

- [ ] Create single `AddressSchema.ts` with canonical definition
- [ ] Remove duplicate declarations
- [ ] Update all imports
- [ ] Ensure exports are preserved
- [ ] All existing tests pass

## Priority

**Low** - Code organization
