# Fix Abi encodeEventLog Null Topic Handling

## Problem

`encodeEventLog` returns `"0x"` for null indexed arguments, but should return `null` in the topics array.

**Location**: `src/primitives/Abi/encodeEventLog.ts#L79-81`

```typescript
return topics.map((t) =>
  t ? Hex.fromBytes(t as Uint8Array) : ("0x" as HexType),  // ❌ Wrong!
);
```

## Why This Matters

- `"0x"` is a valid topic (empty bytes)
- `null` means "match any value" in log filters
- Incorrect encoding breaks event filtering
- Inconsistent with Ethereum RPC semantics

## Solution

Return `null` for null topics:

```typescript
return topics.map((t) =>
  t ? Hex.fromBytes(t as Uint8Array) : null
);

// Update return type:
): Effect.Effect<{
  topics: readonly (HexType | null)[];
  data: HexType;
}, ...>
```

For log filter context:
```typescript
// When encoding filter topics:
// null = match any
// "0x..." = match specific value
// ["0x...", "0x..."] = match any of these values

const filterTopics = [
  eventSignatureHash,     // Must match event
  null,                   // Any value for indexed param 1
  toAddressHash,          // Specific value for indexed param 2
];
```

## Acceptance Criteria

- [ ] Return `null` instead of `"0x"` for null indexed args
- [ ] Update return type to allow `null` in topics array
- [ ] All existing tests pass
- [ ] Add test for null topic handling

## Priority

**Medium** - Semantic correctness
