# Fix Receipt Pre-Byzantium Status Handling

## Problem

Receipt `from.js` requires `status` field but pre-Byzantium receipts use `root` instead. The validation is too strict.

**Location**: `src/primitives/Receipt/from.js#L59-61`

```javascript
// Current (wrong for pre-Byzantium):
if (data.status === undefined) {
  throw new InvalidReceiptError("status is required");
}
```

## Why This Matters

- Pre-Byzantium receipts (pre-October 2017) have `root` instead of `status`
- Historical data queries fail
- Archive node compatibility broken

## Background

- **Pre-Byzantium** (< block 4,370,000): Receipts have `root` (32-byte state root)
- **Post-Byzantium** (>= block 4,370,000): Receipts have `status` (0 or 1)

## Solution

Check for either `status` OR `root`:

```javascript
if (data.status === undefined && data.root === undefined) {
  throw new InvalidReceiptError("Either status or root is required");
}

// Parse appropriately:
const receipt = {
  // ... other fields
  ...(data.status !== undefined && { status: data.status }),
  ...(data.root !== undefined && { root: data.root }),
};
```

Update type:

```typescript
interface ReceiptType {
  // ... other fields
  status?: 0 | 1;  // Post-Byzantium
  root?: Bytes32;  // Pre-Byzantium
}
```

## Acceptance Criteria

- [ ] Accept receipts with `root` instead of `status`
- [ ] Accept receipts with `status` instead of `root`
- [ ] Reject receipts with neither
- [ ] Update type to reflect optionality
- [ ] Add test for pre-Byzantium receipt
- [ ] All existing tests pass

## Priority

**Low** - Historical compatibility
