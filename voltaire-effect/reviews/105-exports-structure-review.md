# Review #105: Exports Structure Review

**Date**: 2026-01-25  
**Scope**: Import/export structure, barrel files, package.json exports  
**Status**: 🟡 Issues Found

---

## Summary

The export structure is **mostly well-organized** with consistent namespace patterns. However, there are **critical issues** that need attention, particularly around the tsup config missing jsonrpc entry and some potential circular dependency risks.

---

## 1. Circular Dependencies

**Status**: ✅ No obvious circular dependencies detected

The structure uses a clean layered approach:
- `primitives/` → standalone, no internal cross-deps
- `crypto/` → depends on primitives (via `@tevm/voltaire`)
- `services/` → depends on both primitives and crypto
- `jsonrpc/` → standalone

The main `index.ts` imports from sub-modules without creating cycles.

---

## 2. Missing Exports

**Status**: 🔴 Critical issues found

### Missing tsup entry point
```typescript
// tsup.config.ts - MISSING jsonrpc entry!
entry: [
  "src/index.ts",
  "src/primitives/index.ts",
  "src/crypto/index.ts",
  "src/services/index.ts",
  // ❌ MISSING: "src/jsonrpc/index.ts"
]
```

**Fix required**: Add `"src/jsonrpc/index.ts"` to tsup entry points.

### Modules NOT exported via subpaths

| Directory | Has package.json export | Exported from index.ts |
|-----------|------------------------|------------------------|
| `block/` | ❌ No | ✅ `BlockUtils` namespace |
| `blockchain/` | ❌ No | ✅ via services |
| `contract/` | ❌ No | ✅ named exports |
| `stream/` | ❌ No | ✅ `Stream` namespace |
| `standards/` | ❌ No | ✅ `ERC20/721/1155/165` namespaces |
| `transaction/` | ❌ No | ✅ via services |

**Recommendation**: These are all accessible via main entry. Consider adding subpath exports if users need direct access for tree-shaking:

```json
"./block": { "types": "./dist/block/index.d.ts", "import": "./dist/block/index.js" },
"./stream": { "types": "./dist/stream/index.d.ts", "import": "./dist/stream/index.js" },
"./standards": { "types": "./dist/standards/index.d.ts", "import": "./dist/standards/index.js" }
```

---

## 3. Subpath Exports vs Actual Structure

**Status**: 🟡 package.json exports partially complete

### Current package.json exports:
| Subpath | Maps to | ✅ Exists |
|---------|---------|----------|
| `.` | `dist/index.js` | ✅ |
| `./primitives` | `dist/primitives/index.js` | ✅ |
| `./crypto` | `dist/crypto/index.js` | ✅ |
| `./services` | `dist/services/index.js` | ✅ |
| `./jsonrpc` | `dist/jsonrpc/index.js` | ⚠️ Source exists, but **not in tsup entry** |

### Missing subpath exports that could improve DX:
- `./block` - block fetch utilities
- `./stream` - stream error types
- `./standards` - ERC token standard helpers

---

## 4. Tree-Shaking

**Status**: ✅ Good

- `"sideEffects": false` set correctly
- Namespace exports (`export * as Foo`) enable tree-shaking
- Individual module indexes allow granular imports
- `treeshake: true` in tsup config

### Pattern analysis:
```typescript
// Main index.ts uses namespace exports - GOOD for tree-shaking
export * as Address from "./primitives/Address/index.js";
export * as Keccak256 from "./crypto/Keccak256/index.js";

// crypto/index.ts mixes styles:
export { hash as keccakHash, KeccakLive } from "./Keccak256/index.js";  // Named
export * from "./Secp256k1/index.js";  // Re-export all (potential barrel bloat)
```

**Minor concern**: `export * from "./Secp256k1/index.js"` in crypto/index.ts could affect tree-shaking if Secp256k1 has many exports.

---

## 5. Type Exports

**Status**: ✅ Good

- `dts: true` in tsup config generates declarations
- Type-only exports properly use `type` keyword:
  ```typescript
  type EventStreamShape,
  type BackfillStreamOptions,
  ```
- `typesVersions` in package.json correctly maps subpaths

---

## 6. Namespace vs Named Exports

**Status**: 🟡 Inconsistent in some areas

### Consistent patterns (GOOD):
```typescript
// Main index.ts - consistent namespace exports for primitives
export * as Address from "./primitives/Address/index.js";
export * as Hex from "./primitives/Hex/index.js";

// Main index.ts - consistent namespace exports for crypto
export * as Keccak256 from "./crypto/Keccak256/index.js";
export * as Secp256k1 from "./crypto/Secp256k1/index.js";
```

### Inconsistent patterns (CONCERN):
```typescript
// Main index.ts - mixes namespace and named for services
export * from "./services/index.js";  // Barrel re-export
export { CryptoLive } from "./crypto/CryptoLive.js";  // Named

// crypto/index.ts - mixes export styles
export * from "./Secp256k1/index.js";  // All from namespace
export { hash as keccakHash } from "./Keccak256/index.js";  // Renamed
```

**Recommendation**: Standardize on namespace exports for modules, named exports only for individual utilities/layers.

---

## 7. Build Configuration

**Status**: 🔴 Entry points incorrect

### tsup.config.ts issues:

```typescript
entry: [
  "src/index.ts",
  "src/primitives/index.ts",
  "src/crypto/index.ts",
  "src/services/index.ts",
  // ❌ MISSING: "src/jsonrpc/index.ts" - defined in package.json exports but not built!
]
```

### Other observations:
- ✅ `format: ["esm"]` - correct for modern Node.js
- ✅ `external: ["@tevm/voltaire", "effect"]` - peer deps externalized
- ✅ `splitting: false` - appropriate for library
- ❓ `treeshake: true` - redundant with ESM but harmless

---

## Action Items

### Critical (P0)
1. **Add jsonrpc to tsup entry**:
   ```typescript
   entry: [
     "src/index.ts",
     "src/primitives/index.ts",
     "src/crypto/index.ts",
     "src/services/index.ts",
     "src/jsonrpc/index.ts",  // ADD THIS
   ]
   ```

### Recommended (P1)
2. **Standardize crypto/index.ts export style** - either all namespace or all named, not mixed
3. **Consider adding subpath exports** for `block`, `stream`, `standards` if direct access is desired

### Nice-to-have (P2)
4. **Remove `export *` from crypto barrel** for Secp256k1 - enumerate exports explicitly for better tree-shaking visibility
5. **Add `./contract` subpath** for EventStream direct access

---

## Verification Commands

```bash
# Build and verify outputs exist
cd voltaire-effect && pnpm build

# Check jsonrpc is built
ls -la dist/jsonrpc/

# Test subpath imports work
node -e "import('voltaire-effect/jsonrpc').then(m => console.log(Object.keys(m)))"
```

---

## Export Map Visual

```
voltaire-effect
├── . (main)
│   ├── BlockUtils (namespace) → ./block/index.js
│   ├── Address, Hex, ... (141 primitives namespaces)
│   ├── Keccak256, Secp256k1, ... (21 crypto namespaces)
│   ├── CryptoLive, CryptoTest (named)
│   ├── ERC20, ERC721, ERC1155, ERC165, StandardsError
│   ├── JsonRpc (namespace) → ./jsonrpc/index.js
│   ├── EventStream, EventStreamService, ... (named)
│   ├── Stream (namespace) → ./stream/index.js
│   └── * from services (barrel)
│
├── ./primitives
│   └── All 141 primitive namespaces
│
├── ./crypto
│   └── All crypto services with named exports
│
├── ./services
│   └── Provider, Signer, Transport, Contract, etc.
│
└── ./jsonrpc ⚠️ (not in tsup entry!)
    └── Request, Response, Error, Batch*, Eth, Wallet, Net, Web3, Txpool, Anvil, Hardhat
```
