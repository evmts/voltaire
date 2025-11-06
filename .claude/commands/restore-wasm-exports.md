# Restore WASM Exports

**Priority: CRITICAL**

40+ lines of WASM exports commented in src/wasm/index.ts.

## Task
Refactor and restore disabled WASM module exports.

## Commented Sections
`src/wasm/index.ts` lines:
- 10-11: keccak256.wasm.ts imports
- 44-55: Signature operations
- 72-73: Wallet key generation
- 77-88: Hash/keccak/signature/wallet exports
- 93-130: Default export members

## Modules to Restore
1. `keccak256.wasm.ts` - Needs refactoring first (line 10 comment)
2. `signature.wasm.ts` - Signature operations
3. `wallet.wasm.ts` - Wallet/key generation

## Steps
1. Check what needs refactoring in each WASM module
2. Fix module structure/exports
3. Uncomment imports in index.ts
4. Uncomment exports
5. Test WASM builds

## Verification
```bash
zig build build-ts-wasm
bun run test:wasm
```

## Dependencies
May need to check individual WASM module implementations before uncommenting.
