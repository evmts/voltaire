# Hybrid Architecture Design: Ox + WASM

## Overview

Three-tier performance system:
1. **Default (Ox)** - TypeScript, code sharing with Viem ecosystem
2. **WASM** - Zig-compiled WebAssembly, opt-in performance
3. **Native** - FFI bindings, Node.js only, maximum performance

---

## Export Structure

### Package.json Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./Hex": "./dist/primitives/Hex/index.js",
    "./wasm": "./dist/wasm/index.js",
    "./wasm/Hex": "./dist/wasm/Hex.js",
    "./native": "./dist/native/index.js",
    "./native/Hex": "./dist/native/Hex.js"
  }
}
```

### Import Patterns

```typescript
// Default: Ox-based (code sharing with Viem)
import { Hex, Address } from '@tevm/voltaire'
// or
import * as Hex from '@tevm/voltaire/Hex'
import * as Address from '@tevm/voltaire/Address'

// WASM-accelerated (opt-in performance)
import { Hex, Address } from '@tevm/voltaire/wasm'
// or
import * as Hex from '@tevm/voltaire/wasm/Hex'
import * as Address from '@tevm/voltaire/wasm/Address'

// Native FFI (Node.js only, maximum performance)
import { Hex, Address } from '@tevm/voltaire/native'
// or
import * as Hex from '@tevm/voltaire/native/Hex'
import * as Address from '@tevm/voltaire/native/Address'
```

---

## File Structure

```
src/
├── index.ts                          # Default exports (Ox-based)
├── primitives/
│   ├── Hex/
│   │   ├── index.ts                  # Ox re-exports + Voltaire extensions
│   │   ├── index.wasm.ts             # WASM bindings
│   │   ├── index.native.ts           # FFI bindings
│   │   ├── extensions.ts             # Voltaire-specific functions (xor, zero, etc.)
│   │   └── types.ts                  # Type definitions
│   ├── Address/
│   │   ├── index.ts                  # Ox re-exports + Voltaire extensions
│   │   ├── index.wasm.ts             # WASM bindings
│   │   ├── index.native.ts           # FFI bindings
│   │   ├── extensions.ts             # Voltaire-specific (isZero, sortAddresses, etc.)
│   │   └── types.ts
│   └── Uint/
│       ├── index.ts                  # Pure Voltaire (no Ox equivalent)
│       ├── index.wasm.ts
│       └── index.native.ts
├── wasm/
│   ├── index.ts                      # Barrel export for all WASM modules
│   ├── Hex.ts                        # Re-export from primitives/Hex/index.wasm.ts
│   ├── Address.ts                    # Re-export from primitives/Address/index.wasm.ts
│   └── loader.ts                     # WASM instantiation logic
└── native/
    ├── index.ts                      # Barrel export for all native modules
    ├── Hex.ts                        # Re-export from primitives/Hex/index.native.ts
    ├── Address.ts                    # Re-export from primitives/Address/index.native.ts
    └── ffi.ts                        # FFI setup logic
```

---

## Implementation Strategy

### Phase 1: Hex Module (Proof of Concept)

#### Step 1: Create Ox-based index

```typescript
// src/primitives/Hex/index.ts
import * as OxHex from 'ox/Hex'

// Re-export all Ox functions
export {
  from,
  fromBoolean,
  fromBytes,
  fromNumber,
  fromString,
  toBoolean,
  toBytes,
  toNumber,
  toString,
  toBigInt,
  concat,
  slice,
  padLeft,
  padRight,
  trimLeft,
  trimRight,
  size,
  isEqual,
  validate,
  assert,
  random,
} from 'ox/Hex'

// Export Voltaire extensions (functions missing in Ox)
export { xor } from './xor.js'
export { zero } from './zero.js'
export { isSized } from './isSized.js'
export { assertSize } from './assertSize.js'

// Alias for API compatibility (minor naming differences)
export { isEqual as equals } from 'ox/Hex'
export { padLeft as pad } from 'ox/Hex'  // Generic pad defaults to left
export { trimLeft as trim } from 'ox/Hex'  // Generic trim defaults to left

// Type exports
export type { Hex } from './types.js'
```

#### Step 2: Voltaire Extensions

```typescript
// src/primitives/Hex/xor.ts
import type { Hex } from './types.js'
import { toBytes, fromBytes } from 'ox/Hex'

/**
 * XOR two hex values
 * (Missing in Ox, keep Voltaire implementation)
 */
export function xor(a: Hex, b: Hex): Hex {
  const bytesA = toBytes(a)
  const bytesB = toBytes(b)
  const result = new Uint8Array(Math.max(bytesA.length, bytesB.length))

  for (let i = 0; i < result.length; i++) {
    result[i] = (bytesA[i] || 0) ^ (bytesB[i] || 0)
  }

  return fromBytes(result)
}
```

#### Step 3: WASM Wrapper

```typescript
// src/primitives/Hex/index.wasm.ts
import { loadWasm } from '../../wasm/loader.js'
import type { Hex } from './types.js'

const wasm = await loadWasm()

// WASM-accelerated implementations
export function concat(...values: Hex[]): Hex {
  return wasm.hex_concat(values)
}

export function keccak256(value: Hex): Hex {
  return wasm.hex_keccak256(value)
}

// Re-export Ox for non-accelerated functions
export {
  from,
  fromBoolean,
  fromBytes,
  fromNumber,
  fromString,
  toBoolean,
  toBytes,
  toNumber,
  toString,
  toBigInt,
  slice,
  padLeft,
  padRight,
  trimLeft,
  trimRight,
  size,
  isEqual,
  validate,
  assert,
  random,
} from 'ox/Hex'

// Re-export Voltaire extensions
export { xor, zero, isSized, assertSize } from './index.js'
```

#### Step 4: Native FFI Wrapper

```typescript
// src/primitives/Hex/index.native.ts
import { ffi } from '../../native/ffi.js'
import type { Hex } from './types.js'

// Native FFI implementations (maximum performance)
export function concat(...values: Hex[]): Hex {
  return ffi.hex_concat(values)
}

export function keccak256(value: Hex): Hex {
  return ffi.hex_keccak256(value)
}

// Re-export Ox for non-accelerated functions
export {
  from,
  fromBoolean,
  fromBytes,
  fromNumber,
  fromString,
  toBoolean,
  toBytes,
  toNumber,
  toString,
  toBigInt,
  slice,
  padLeft,
  padRight,
  trimLeft,
  trimRight,
  size,
  isEqual,
  validate,
  assert,
  random,
} from 'ox/Hex'

// Re-export Voltaire extensions
export { xor, zero, isSized, assertSize } from './index.js'
```

#### Step 5: Barrel Exports

```typescript
// src/wasm/Hex.ts
export * from '../primitives/Hex/index.wasm.js'

// src/native/Hex.ts
export * from '../primitives/Hex/index.native.js'
```

---

## Migration Checklist (Per Module)

### For Each Module (e.g., Hex, Address, Signature):

- [ ] **Analyze Ox API coverage**
  - Map Voltaire functions to Ox equivalents
  - Identify missing functions (Voltaire extensions)
  - Note naming differences (create aliases)

- [ ] **Create Ox-based index**
  - Re-export Ox functions
  - Import and export Voltaire extensions
  - Add aliases for naming differences

- [ ] **Extract Voltaire extensions**
  - Move unique functions to separate files (e.g., `xor.ts`, `zero.ts`)
  - Keep existing implementations if Ox doesn't provide
  - Use Ox internally where possible (DRY principle)

- [ ] **Create WASM wrapper**
  - Identify performance-critical functions for WASM acceleration
  - Import WASM bindings for accelerated functions
  - Re-export Ox for non-accelerated functions
  - Re-export Voltaire extensions

- [ ] **Create Native FFI wrapper** (if applicable)
  - Same strategy as WASM
  - Node.js-only (check platform at runtime)

- [ ] **Update types**
  - Align type definitions with Ox where possible
  - Keep Voltaire branded types if needed
  - Export both Ox types and Voltaire types

- [ ] **Update tests**
  - Test all three tiers (Ox, WASM, Native)
  - Verify API compatibility
  - Add tests for Voltaire extensions

- [ ] **Update documentation**
  - Document which functions come from Ox
  - Document Voltaire extensions
  - Document performance tier differences
  - Add migration guide examples

---

## Benefits

### 1. Code Sharing with Viem Ecosystem
✅ Users can share code between Viem and Voltaire
✅ Reduced bundle size when using both libraries
✅ Consistent API patterns

### 2. Performance Flexibility
✅ Default: Small bundle, fast startup (Ox TypeScript)
✅ WASM: 2-10x faster for crypto operations
✅ Native: Maximum performance for Node.js servers

### 3. Gradual Adoption
✅ Existing Voltaire users can upgrade without breaking
✅ Can migrate module-by-module
✅ Fallback to Ox if WASM/Native unavailable

### 4. Maintenance Reduction
✅ Offload 60% of implementations to Ox team
✅ Focus Voltaire development on unique value (Zig/WASM/Native)
✅ Contribute to Ox for missing features (upstream collaboration)

---

## API Compatibility Matrix

| Module | Ox Default | WASM | Native | Breaking Changes |
|--------|------------|------|--------|------------------|
| **Hex** | ✅ 90% | ✅ Full | ✅ Full | `equals()` → `isEqual()` (alias provided) |
| **Address** | ✅ 60% | ✅ Full | ✅ Full | `toChecksummed()` → `checksum()` (alias provided) |
| **Bytes** | ✅ 100% | ✅ Full | ✅ Full | None |
| **Signature** | ✅ 100% | ✅ Full | ✅ Full | None |
| **Base64** | ✅ 100% | N/A | N/A | None |
| **Rlp** | ✅ 100% | ✅ Full | ✅ Full | `encode()` → `from()` (alias provided) |
| **Transaction** | ✅ 80% | ✅ Full | ✅ Full | API redesign (type-specific envelopes) |
| **Abi** | ✅ 90% | ✅ Full | ✅ Full | Granular module structure |
| **Uint** | ❌ 0% | ✅ Full | ✅ Full | Keep pure Voltaire (no Ox equivalent) |

---

## Performance Expectations

Based on existing benchmarks, expected performance tiers:

| Operation | Ox (Default) | WASM | Native | Speedup (WASM) | Speedup (Native) |
|-----------|--------------|------|--------|----------------|------------------|
| `Hex.concat()` | ~100 μs | ~50 μs | ~20 μs | 2x | 5x |
| `Hex.keccak256()` | ~500 μs | ~50 μs | ~30 μs | 10x | 16x |
| `Address.fromPublicKey()` | ~800 μs | ~100 μs | ~50 μs | 8x | 16x |
| `Rlp.encode()` | ~200 μs | ~80 μs | ~40 μs | 2.5x | 5x |
| `Signature.verify()` | ~1500 μs | ~200 μs | ~100 μs | 7.5x | 15x |

*Estimates based on existing Voltaire WASM vs TS benchmarks*

---

## Bundle Size Impact

Expected bundle sizes (tree-shaken):

| Import Pattern | Bundle Size | Notes |
|---------------|-------------|-------|
| `import { Hex } from 'voltaire'` | ~5 KB | Ox re-exports (minified) |
| `import { Hex } from 'voltaire/wasm'` | ~45 KB | 5 KB JS + 40 KB WASM |
| `import { Hex } from 'voltaire/native'` | ~8 KB | JS bindings only (native .dylib separate) |
| Full library (Ox) | ~150 KB | All primitives |
| Full library (WASM) | ~500 KB | All primitives + WASM |

**Comparison:**
- Current Voltaire: ~180 KB (all TS implementations)
- Ox alone: ~120 KB
- **Savings:** ~60 KB when using Ox default

---

## Rollout Plan

### v2.0.0-alpha.1 (Week 1)
- ✅ Hex module migration (proof of concept)
- ✅ WASM/Native wrappers for Hex
- ✅ Tests and benchmarks
- ✅ Documentation

### v2.0.0-alpha.2 (Week 2)
- Address, Bytes, Signature modules
- Update package.json exports
- Migration guide (draft)

### v2.0.0-beta.1 (Week 3)
- Remaining primitives (Rlp, AccessList, Authorization, Blob, etc.)
- Complete test coverage
- Benchmark comparison doc

### v2.0.0-beta.2 (Week 4)
- Transaction module (API redesign)
- Abi module (granular structure)
- Full documentation update

### v2.0.0-rc.1 (Week 5)
- Bug fixes from beta feedback
- Performance optimizations
- Final migration guide

### v2.0.0 (Week 6)
- Stable release
- Announcement blog post
- Viem ecosystem collaboration

---

## Risks & Mitigation

### Risk 1: Ox API Changes (pre-1.0)
**Impact:** High
**Probability:** Medium
**Mitigation:**
- Lock Ox version in package.json
- Monitor Ox releases
- Maintain Voltaire extensions as fallback
- Contribute to Ox to influence API

### Risk 2: Bundle Size Regression
**Impact:** Medium
**Probability:** Low
**Mitigation:**
- Tree-shaking verification tests
- Bundle size CI checks
- Size-limit configuration

### Risk 3: WASM Loading Overhead
**Impact:** Low
**Probability:** Low
**Mitigation:**
- Lazy load WASM only when used
- Preload option for performance-critical apps
- Fallback to Ox if WASM fails

### Risk 4: Breaking Changes for Users
**Impact:** High
**Probability:** Guaranteed
**Mitigation:**
- Detailed migration guide
- Aliases for renamed functions
- Deprecation warnings in v1.x
- Codemod scripts for automatic migration

---

## Open Questions

1. **Should we maintain v1.x LTS branch?**
   - Option A: Yes, backport critical fixes for 6 months
   - Option B: No, clean break to v2.0

2. **What's the WASM fallback strategy?**
   - Option A: Fail to Ox if WASM unavailable
   - Option B: Warn and use Ox
   - Option C: Error and require explicit opt-in

3. **Should native FFI be bundled or opt-in dependency?**
   - Option A: Optional peer dependency (user installs if needed)
   - Option B: Always bundled (increases package size)
   - Option C: Separate `@tevm/voltaire-native` package

4. **How to handle type incompatibilities between Ox and Voltaire?**
   - Option A: Adopt Ox types completely (breaking)
   - Option B: Wrapper types that extend Ox
   - Option C: Dual type exports (Ox + Voltaire)

---

## Success Metrics

After v2.0 release:

- [ ] **Adoption:** 50%+ of Voltaire users upgrade within 3 months
- [ ] **Bundle Size:** 30-40% reduction for Ox-only users
- [ ] **Performance:** WASM tier maintains 5-10x speedup over Ox
- [ ] **Ecosystem:** 3+ Viem+Voltaire integration examples in wild
- [ ] **Maintenance:** 50% reduction in primitive implementation PRs
- [ ] **Contributions:** 5+ features contributed upstream to Ox

---

## Conclusion

Hybrid architecture balances:
- ✅ **Ecosystem alignment** (Ox default)
- ✅ **Performance** (WASM/Native opt-in)
- ✅ **Flexibility** (Users choose their tier)
- ✅ **Maintenance** (Offload to Ox)

Next: Implement Hex module proof of concept.
