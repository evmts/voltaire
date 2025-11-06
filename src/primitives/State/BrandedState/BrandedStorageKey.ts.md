---
title: "BrandedStorageKey"
---

# BrandedStorageKey

Composite key type for EVM storage operations.

## Type Definition

```typescript
type BrandedStorageKey = {
  readonly address: BrandedAddress;
  readonly slot: bigint;
}
```

## Properties

### address
- Type: `BrandedAddress`
- 20-byte contract address
- Identifies which contract's storage space

### slot
- Type: `bigint`
- 256-bit storage slot number
- Range: 0 to 2^256 - 1
- Most slots remain zero (sparse allocation)

## Related Types

### StorageKeyLike
```typescript
type StorageKeyLike = BrandedStorageKey | {
  address: BrandedAddress;
  slot: bigint;
}
```

Input type for functions accepting storage keys.

## Design

**Composite Key:**
- Combines contract address with slot number
- Each contract has 2^256 storage slots
- Slots are sparsely allocated

**Immutable:**
- Both fields are readonly
- Safe to pass by reference

**String Conversion:**
- Use `StorageKey.toString()` for Map keys
- Format: `{40_hex_chars}_{64_hex_chars}`

## Example

```typescript
const key: BrandedStorageKey = {
  address: contractAddr,
  slot: 0n
};

// Use in storage map
const storage = new Map<string, bigint>();
storage.set(StorageKey.toString(key), value);

// Multiple slots per contract
const slot0 = { address: token, slot: 0n }; // Total supply
const slot1 = { address: token, slot: 1n }; // Owner
const slot2 = { address: token, slot: 2n }; // Name
```
