# Complete Zig Documentation

**Priority: MEDIUM**

Complete colocated Zig documentation for all modules (primitives, crypto, precompiles).

---

## TL;DR - Quick Start

**What:** Document 56 Zig modules with colocated MDX files
**Where:** Create MDX alongside `.zig` source, symlink to `src/content/docs/zig/`
**Pattern:** See examples: `src/primitives/address.mdx`, `src/crypto/secp256k1.mdx`

**Quick workflow:**
```bash
# 1. Create: src/{section}/{module}.mdx (use template below)
# 2. Symlink: mkdir + ln -sf (commands in "Creating New Documentation")
# 3. Verify: bun run docs:dev → http://localhost:4321/zig/{section}/{module}/
```

**Read first:**
- Example docs: `src/primitives/address.mdx`, `src/crypto/secp256k1.mdx`
- Pattern guide: `src/content/docs/zig/COLOCATED-DOCS.md`
- Gotchas: Avoid `<`, `>`, `---` in text (see "MDX Gotchas" section)

**54 modules remaining** (2 done: address, secp256k1)

---

## Context

**What was completed:**
- ✅ Zig docs infrastructure with separate navigation (`/zig/*` path)
- ✅ Custom `Sidebar.astro` component (route-based filtering)
- ✅ Initial pages: `/zig/index.mdx`, `/zig/getting-started.mdx`, `/zig/contributing.mdx`
- ✅ Pattern guide: `src/content/docs/zig/COLOCATED-DOCS.md`
- ✅ Example docs: `src/primitives/address.mdx`, `src/crypto/secp256k1.mdx` (with symlinks)
- ✅ Dev server working: `bun run docs:dev`

**Architecture:**
- Same Starlight site, completely separate navigation
- TypeScript docs: `/`, `/primitives/*`, `/crypto/*`, `/getting-started`
- Zig docs: `/zig/*` (separate sidebar shown only on Zig paths)
- Colocated pattern: MDX alongside `.zig` source, symlinked to `src/content/docs/zig/`

## Task

Create comprehensive Zig documentation for all 56 modules across primitives, crypto, and precompiles.

## Colocated Documentation Pattern

### File Structure

```
src/
├── primitives/
│   ├── address.zig              # Source
│   └── address.mdx              # Docs (colocated) ✅ DONE
├── crypto/
│   ├── secp256k1.zig            # Source
│   └── secp256k1.mdx            # Docs (colocated) ✅ DONE
└── content/docs/zig/
    ├── primitives/address/
    │   └── index.mdx → ../../../../../primitives/address.mdx
    └── crypto/secp256k1/
        └── index.mdx → ../../../../../crypto/secp256k1.mdx
```

### Creating New Documentation

#### Step 1: Create MDX alongside source

**For primitives:**
```bash
# Create: src/primitives/{module}.mdx
```

**For crypto:**
```bash
# Create: src/crypto/{module}.mdx
```

**For precompiles:**
```bash
# Create: src/precompiles/{module}.mdx
```

#### Step 2: Create symlink

**For primitives:**
```bash
mkdir -p src/content/docs/zig/primitives/{module}
ln -sf ../../../../../../primitives/{module}.mdx \
  src/content/docs/zig/primitives/{module}/index.mdx
```

**For crypto:**
```bash
mkdir -p src/content/docs/zig/crypto/{module}
ln -sf ../../../../../../crypto/{module}.mdx \
  src/content/docs/zig/crypto/{module}/index.mdx
```

**For precompiles:**
```bash
mkdir -p src/content/docs/zig/precompiles/{module}
ln -sf ../../../../../../precompiles/{module}.mdx \
  src/content/docs/zig/precompiles/{module}/index.mdx
```

#### Step 3: Verify

```bash
bun run docs:dev
# Navigate to http://localhost:4321/zig/primitives/{module}/
```

## MDX Template for Zig Modules

```mdx
---
title: ModuleName
description: One-line description of module purpose
---

# ModuleName

Overview paragraph explaining what this module does and why it exists.

## Overview

The ModuleName module provides:
- **Feature 1**: Description
- **Feature 2**: Description
- **Feature 3**: Description

**Source**: \`src/{primitives|crypto|precompiles}/modulename.zig\`

## Key Functions

### functionName

\`\`\`zig
const {primitives|crypto|precompiles} = @import("{primitives|crypto|precompiles}");

// Function signature and description
pub fn functionName(param: Type) !ReturnType {
    return {primitives|crypto|precompiles}.ModuleName.functionName(param);
}
\`\`\`

**Parameters:**
- \`param\`: Description

**Returns:** Description

**Errors:** List possible errors

### anotherFunction

\`\`\`zig
// Example usage
\`\`\`

## Types

### MainType

\`\`\`zig
pub const MainType = struct {
    field1: Type,  // Description
    field2: Type,  // Description
};
\`\`\`

## Examples

### Common Use Case

\`\`\`zig
const std = @import("std");
const {module} = @import("{primitives|crypto|precompiles}");

pub fn example() !void {
    // Demonstrate realistic usage
    const result = try {module}.function(args);
    // ...
}
\`\`\`

## Performance

**Native (ReleaseFast)**:
- Operation 1: ~XXX ns/μs/ms
- Operation 2: ~XXX ns/μs/ms

**WASM (ReleaseFast)**:
- Operation 1: ~XXX ns/μs/ms
- Operation 2: ~XXX ns/μs/ms

## Testing

\`\`\`bash
zig build test -Dtest-filter={modulename}
\`\`\`

Test coverage includes:
- Known test vectors
- Edge cases
- Invalid inputs
- Cross-validation

## Security Considerations

(If applicable)
- Constant-time operations
- Input validation
- Memory safety
- Known vulnerabilities

## Related

- [Related Module 1](/zig/{section}/{module}/) - How they relate
- [Related Module 2](/zig/{section}/{module}/) - How they relate

## References

- [Relevant EIP](https://eips.ethereum.org/EIPS/eip-XXXX)
- [Specification](https://link-to-spec)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section X
\`\`\`

## Modules to Document (56 total)

### Primitives (22 modules)

**Core Types** (5):
- [ ] `address` - ✅ DONE (example exists)
- [ ] `hash` - 32-byte hash primitive
- [ ] `hex` - Hexadecimal encoding/decoding
- [ ] `base64` - Base64 encoding/decoding
- [ ] `denomination` - Wei/Gwei/Ether units

**Encoding** (3):
- [ ] `abi` - ABI encoding/decoding
- [ ] `rlp` - RLP encoding/decoding
- [ ] `trie` - Merkle Patricia Trie

**Transactions** (4):
- [ ] `transaction` - All transaction types
- [ ] `accesslist` - EIP-2930 access lists
- [ ] `authorization` - EIP-7702 authorization
- [ ] `blob` - EIP-4844 blob data

**EVM** (4):
- [ ] `opcode` - EVM opcode enumeration
- [ ] `bytecode` - Bytecode utilities
- [ ] `bloomfilter` - Bloom filters for logs
- [ ] `state` - Account state

**Standards** (3):
- [ ] `eventlog` - Contract event logs
- [ ] `siwe` - Sign-In with Ethereum
- [ ] `signature` - Signature types

**Protocol** (3):
- [ ] `hardfork` - Hardfork identifiers
- [ ] `chain` - Chain IDs
- [ ] `feemarket` - EIP-1559 fee calculations
- [ ] `gasconstants` - Gas cost constants

### Crypto (13 modules)

**Hash Functions** (4):
- [ ] `hash` - Hash utilities
- [ ] `blake2` - Blake2b hashing
- [ ] `ripemd160` - RIPEMD-160 hashing
- [ ] `hash_algorithms` - Hash algorithm implementations

**Digital Signatures** (2):
- [ ] `secp256k1` - ✅ DONE (example exists)
- [ ] `x25519` - X25519 key exchange

**Key Management** (2):
- [ ] `eip712` - Typed data signing
- [ ] `crypto` - Core crypto module

**Advanced Crypto** (5):
- [ ] `bn254` - BN254 curve operations
- [ ] `c_kzg` - KZG commitments
- [ ] `modexp` - Modular exponentiation
- [ ] `aes_gcm` - AES-GCM encryption
- [ ] `bn254_arkworks` - Arkworks BN254

### Precompiles (21 modules)

**Basic Precompiles** (5):
- [ ] `ecrecover` - 0x01: Signature recovery
- [ ] `sha256` - 0x02: SHA-256 hash
- [ ] `ripemd160` - 0x03: RIPEMD-160 hash
- [ ] `identity` - 0x04: Identity function
- [ ] `modexp` - 0x05: Modular exponentiation

**BN254 Precompiles** (3):
- [ ] `bn254_add` - 0x06: BN254 addition
- [ ] `bn254_mul` - 0x07: BN254 multiplication
- [ ] `bn254_pairing` - 0x08: BN254 pairing check

**BLS12-381 Precompiles** (10):
- [ ] `bls12_g1_add` - 0x0b: BLS12-381 G1 addition
- [ ] `bls12_g1_mul` - 0x0c: BLS12-381 G1 multiplication
- [ ] `bls12_g1_msm` - 0x0d: BLS12-381 G1 multi-scalar multiplication
- [ ] `bls12_g2_add` - 0x0e: BLS12-381 G2 addition
- [ ] `bls12_g2_mul` - 0x0f: BLS12-381 G2 multiplication
- [ ] `bls12_g2_msm` - 0x10: BLS12-381 G2 multi-scalar multiplication
- [ ] `bls12_pairing` - 0x11: BLS12-381 pairing check
- [ ] `bls12_map_fp_to_g1` - 0x12: BLS12-381 map field to G1
- [ ] `bls12_map_fp2_to_g2` - 0x13: BLS12-381 map field extension to G2

**Modern Precompiles** (2):
- [ ] `blake2f` - 0x09: Blake2f compression
- [ ] `point_evaluation` - 0x14: KZG point evaluation (EIP-4844)

**Utilities** (1):
- [ ] `common` - Common precompile utilities

## Content Guidelines

### Required Sections

1. **Title & Description** (frontmatter)
2. **Overview** - What & why
3. **Key Functions** - Main API with signatures
4. **Types** - Data structures
5. **Examples** - Realistic usage (2-3 examples)
6. **Performance** - Benchmarks (native & WASM)
7. **Testing** - How to test
8. **Related** - Cross-links to related modules
9. **References** - EIPs, specs, papers

### Optional Sections

- **Security Considerations** (for crypto modules)
- **Gas Costs** (for precompiles)
- **Memory Management** (if allocations involved)
- **Edge Cases** (complex behavior)

### Code Examples Best Practices

- Use realistic scenarios
- Show error handling
- Include imports
- Demonstrate common patterns
- Keep examples concise (10-20 lines)

## Information Sources

### 1. Source Code

Read the `.zig` files to understand:
- Public API (`pub fn`, `pub const`)
- Function signatures
- Error types
- Data structures
- Inline documentation (`//!` comments)

Example:
```bash
# Read module root documentation
cat src/primitives/root.zig | head -100

# Read specific module
cat src/crypto/secp256k1.zig
```

### 2. Test Files

Tests show usage patterns:
```bash
# Find inline tests in source
grep -A 20 "^test " src/crypto/secp256k1.zig
```

### 3. TypeScript Documentation

Reference existing TS docs for structure:
```bash
# See how TypeScript docs are structured
cat src/content/docs/primitives/address/index.mdx
```

### 4. Existing Examples

Reference completed Zig docs:
- `src/primitives/address.mdx` - Primitive example
- `src/crypto/secp256k1.mdx` - Crypto example
- `src/content/docs/zig/getting-started.mdx` - Build/test info
- `src/content/docs/zig/contributing.mdx` - Code patterns

## MDX Gotchas (IMPORTANT!)

### ⚠️ Avoid These Patterns

**1. Comparison operators in text:**
```mdx
❌ Operations <100ns          # MDX interprets as HTML tag
✅ Operations less than 100ns
```

**2. Horizontal rules in content:**
```mdx
❌ ---                         # Conflicts with frontmatter
✅ ***                         # Use triple asterisk instead
```

**3. Angle brackets in text:**
```mdx
❌ Input <type>                # MDX interprets as HTML
✅ Input (type)
✅ Input `<type>`              # Use backticks for code
```

## Development Workflow

### Incremental Approach

1. **Start with high-priority modules:**
   - Primitives: address (✅), hash, hex, abi, transaction
   - Crypto: secp256k1 (✅), blake2, ripemd160, eip712
   - Precompiles: ecrecover, sha256, bn254_add, bls12_g1_add

2. **Work in batches:**
   - Create 3-5 docs at a time
   - Test after each batch
   - Commit incrementally

3. **Use templates:**
   - Copy existing examples
   - Adapt structure to module specifics
   - Maintain consistency

### Verification Steps

After creating docs:

```bash
# 1. Check symlinks
ls -la src/content/docs/zig/{section}/{module}/index.mdx

# 2. Start dev server
bun run docs:dev

# 3. Navigate to docs
# http://localhost:4321/zig/{section}/{module}/

# 4. Verify separate navigation
# - TypeScript pages show TS nav
# - Zig pages (/zig/*) show Zig nav only
```

### Common Issues

**Symlink not working:**
```bash
# Remove and recreate
rm src/content/docs/zig/{section}/{module}/index.mdx
ln -sf ../../../../../../{section}/{module}.mdx \
  src/content/docs/zig/{section}/{module}/index.mdx
```

**Build errors:**
```bash
# Check for MDX gotchas (< > --- in text)
grep -n '[<>]' src/{section}/{module}.mdx
grep -n '^---$' src/{section}/{module}.mdx | tail -n +4  # Skip frontmatter
```

**Module not appearing in sidebar:**
- Check frontmatter has `title` and `description`
- Verify symlink is in correct location
- Restart dev server

## Success Criteria

- [ ] All 56 modules documented with MDX files
- [ ] All symlinks created and working
- [ ] Dev server builds without errors
- [ ] Each doc page accessible at `/zig/{section}/{module}/`
- [ ] Navigation shows Zig-only items on `/zig/*` paths
- [ ] Code examples compile (verify with source)
- [ ] Cross-links between related modules work

## Example Workflow

```bash
# 1. Choose a module
MODULE=hash

# 2. Read the source
cat src/primitives/hash.zig | head -200

# 3. Create documentation
# Edit: src/primitives/hash.mdx
# Use template above, fill in details from source

# 4. Create symlink
mkdir -p src/content/docs/zig/primitives/hash
ln -sf ../../../../../../primitives/hash.mdx \
  src/content/docs/zig/primitives/hash/index.mdx

# 5. Verify
bun run docs:dev
# Visit http://localhost:4321/zig/primitives/hash/

# 6. Commit
git add src/primitives/hash.mdx src/content/docs/zig/primitives/hash
git commit -m "📚 docs: Add Zig documentation for hash primitive"
```

## Priority Order

### Phase 1: Core Primitives (7 modules)
1. hash
2. hex
3. abi
4. rlp
5. transaction
6. bytecode
7. bloomfilter

### Phase 2: Essential Crypto (5 modules)
1. blake2
2. ripemd160
3. eip712
4. modexp
5. bn254

### Phase 3: Precompiles Foundation (8 modules)
1. ecrecover
2. sha256
3. ripemd160
4. identity
5. modexp
6. bn254_add
7. bn254_mul
8. bn254_pairing

### Phase 4: Advanced BLS12-381 (10 modules)
All BLS12-381 precompiles

### Phase 5: Remaining Modules (26 modules)
Everything else

## Notes

- **Pattern guide:** See `src/content/docs/zig/COLOCATED-DOCS.md`
- **Examples:** `src/primitives/address.mdx`, `src/crypto/secp256k1.mdx`
- **Build commands:** See `src/content/docs/zig/getting-started.mdx`
- **Code style:** See `src/content/docs/zig/contributing.mdx`
- **No build required:** Dev server hot-reloads MDX changes
- **Zig version:** 0.15.1 (important for API references)

## Resources

- [Zig 0.15.1 Docs](https://ziglang.org/documentation/0.15.1/)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP Repository](https://eips.ethereum.org/)
- [Starlight MDX Guide](https://starlight.astro.build/guides/authoring-content/)

---

**Remember:** This is documentation for Zig implementations. Focus on:
- Zig API and idioms
- Performance characteristics
- Memory management patterns
- Zig-specific testing approaches
- Zero-copy operations where applicable
