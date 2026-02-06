# Add Batch Operations

**Priority: LOW**

Add batch operation helpers for common primitives.

## Task
Add batch processing methods for arrays of values.

## Primitives to Enhance

### Uint
```typescript
sum(...values: Uint[]): Uint
  // Sum array of Uints

product(...values: Uint[]): Uint
  // Multiply array of Uints

min(...values: Uint[]): Uint
  // Find minimum

max(...values: Uint[]): Uint
  // Find maximum

gcd(a: Uint, b: Uint): Uint
  // Greatest common divisor

lcm(a: Uint, b: Uint): Uint
  // Least common multiple

isPowerOf2(value: Uint): boolean
  // Check if power of 2
```

### BloomFilter
```typescript
combine(...filters: BloomFilter[]): BloomFilter
  // OR multiple bloom filters

density(filter): number
  // Get filter density (% bits set)

expectedFalsePositiveRate(filter, itemCount): number
  // Calculate false positive rate
```

### Hash
```typescript
concat(...hashes: Hash[]): Hash
  // Concatenate and hash

merkleRoot(hashes: Hash[]): Hash
  // Calculate merkle root
```

### Address
```typescript
sortAddresses(addresses: Address[]): Address[]
  // Sort addresses

deduplicateAddresses(addresses: Address[]): Address[]
  // Remove duplicates
```

## Pattern
Add to respective primitive namespaces.

## Verification
```bash
bun run test -- batch
```
