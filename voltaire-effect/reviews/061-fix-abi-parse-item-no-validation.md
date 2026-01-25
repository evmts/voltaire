# Fix Abi parseItem No Schema Validation

## Problem

`parseItem` just uses `JSON.parse` without validating that the result matches the expected ABI item structure.

**Location**: `src/primitives/Abi/parseItem.ts#L57`

```typescript
Effect.try({
  try: () => JSON.parse(jsonString) as Item.ItemType,  // ❌ No validation!
  catch: (e) => new AbiItemParseError({ ... }),
})
```

## Why This Matters

- Invalid JSON structure typed as valid ABI item
- Runtime errors when using malformed item
- Type assertion bypasses safety
- Could accept `{"foo": "bar"}` as valid ABI item

## Solution

Add Schema validation:

```typescript
import * as Schema from "effect/Schema";
import { AbiItemSchema } from "./schemas";

export const parseItem = (
  jsonString: string,
): Effect.Effect<Item.ItemType, AbiItemParseError> =>
  Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(jsonString),
      catch: (e) => new AbiItemParseError({
        input: jsonString,
        message: `Invalid JSON: ${e}`,
      }),
    });
    
    return yield* Schema.decodeUnknown(AbiItemSchema)(parsed).pipe(
      Effect.mapError((e) => new AbiItemParseError({
        input: jsonString,
        message: `Invalid ABI item structure: ${e}`,
      }))
    );
  });
```

Or use existing validation:

```typescript
import { validateAbiItem } from "./validate";

export const parseItem = (jsonString: string) =>
  Effect.try({
    try: () => {
      const parsed = JSON.parse(jsonString);
      validateAbiItem(parsed);  // Throws if invalid
      return parsed as Item.ItemType;
    },
    catch: (e) => new AbiItemParseError({ input: jsonString, message: String(e) }),
  });
```

## Acceptance Criteria

- [ ] Add structure validation after JSON.parse
- [ ] Reject non-ABI-item objects
- [ ] Provide helpful error messages
- [ ] All existing tests pass
- [ ] Add test for invalid structure

## Priority

**Medium** - Input validation
