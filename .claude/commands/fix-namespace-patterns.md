# Standardize Namespace Export Pattern

**Priority: MEDIUM**

6 primitives use inconsistent dual export patterns.

## Task
Standardize dual export pattern across: Denomination, Siwe, Opcode, Chain, FeeMarket, State.

## Standard Pattern
```typescript
// Internal method (toHex.js)
export function toHex(this: BrandedType): Hex { ... }

// Index.ts
export { toHex as _toHex } from "./toHex.js";   // Internal
export function toHex(value: Input): Hex {      // Public wrapper
  return _toHex.call(from(value));
}
```

## Primitives to Fix
1. **Denomination** - Mixed patterns across BrandedEther/Wei/Gwei
2. **Siwe** - No factory wrapper
3. **Opcode** - Type assertion only pattern
4. **Chain** - Minimal API
5. **FeeMarket** - Direct exports only
6. **State** - Naming mismatch (StorageKey)

## Steps
1. Review each primitive's index.ts
2. Add missing _internal exports
3. Add wrapper functions where needed
4. Ensure consistent pattern
5. Update tests

## Verification
```bash
bun run test:run
```
