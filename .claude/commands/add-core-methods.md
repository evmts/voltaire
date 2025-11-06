# Add Core Methods to All Primitives

**Priority: HIGH**

Many primitives missing common methods: `toBytes()`, `clone()`.

## Task
Add missing core methods to primitives that lack them.

## Methods to Add

### toBytes()
Missing from 13 primitives. Should return underlying Uint8Array.

```typescript
export function toBytes(this: BrandedType): Uint8Array {
  return new Uint8Array(this);
}
```

### clone()
Missing from 20 primitives. Should return deep copy.

```typescript
export function clone(this: BrandedType): BrandedType {
  return from(new Uint8Array(this));
}
```

## Steps
1. Search which primitives lack these methods
2. Add implementation files (toBytes.ts, clone.ts)
3. Add to index.ts exports (dual export pattern)
4. Add tests
5. Focus on Uint8Array-based primitives first

## Priority Primitives
Start with: Hash, Hex, Address, Uint (most commonly used)

## Verification
```bash
bun run test -- toBytes
bun run test -- clone
```
