# Fix BLS12 Map Hardfork Constants

**Priority: LOW**

BLS12 map precompiles have wrong hardfork activation.

## Task
Update hardfork constants for BLS12_MAP_FP_TO_G1 and BLS12_MAP_FP2_TO_G2.

## Files
`src/precompiles/precompiles.ts:127-132`

## Issue
```typescript
// Current (WRONG)
BLS12_MAP_FP_TO_G1: { address: "0x12", hardfork: "CANCUN" },
BLS12_MAP_FP2_TO_G2: { address: "0x13", hardfork: "CANCUN" },

// Should be
BLS12_MAP_FP_TO_G1: { address: "0x12", hardfork: "PRAGUE" },
BLS12_MAP_FP2_TO_G2: { address: "0x13", hardfork: "PRAGUE" },
```

## Verification
Check EIP specification for activation hardfork.

```bash
bun run test -- precompiles
```
