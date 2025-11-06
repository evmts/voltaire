---
description: Update Starlight documentation with comprehensive context
---

You are tasked with updating the Voltaire Starlight documentation. Follow these patterns and structures precisely.

## CRITICAL CONTEXT

**Architecture**: Dual API (Class + Branded Types), multi-language (TS/Zig/Rust/C), tree-shakeable, WASM-accelerated
**Docs Framework**: Astro Starlight (MDX), auto-generated sidebar, colocated docs pattern
**Communication**: Brief, concise, evidence-based. No fluff.

---

## DOCUMENTATION STRUCTURE

### Directory Layout

```
src/content/docs/               # Centralized docs
├── getting-started.mdx         # Main intro
├── primitives/
│   ├── branded-types.mdx       # Overview of branded type pattern
│   ├── address/                # Centralized (11 primitives total)
│   │   ├── index.mdx          # Main overview with CardGrid
│   │   ├── branded-address.mdx
│   │   ├── constructors.mdx
│   │   ├── conversions.mdx
│   │   ├── validation.mdx
│   │   ├── comparisons.mdx
│   │   ├── contract-addresses.mdx
│   │   ├── uint8array-methods.mdx
│   │   ├── variants.mdx
│   │   └── wasm.mdx
│   ├── abi -> ../../../primitives/Abi        # Symlinks (12 primitives)
│   ├── accesslist -> ../../../primitives/AccessList
│   ├── authorization -> ../../../primitives/Authorization
│   ├── blob -> ../../../primitives/Blob
│   ├── eventlog -> ../../../primitives/EventLog
│   ├── feemarket -> ../../../primitives/FeeMarket
│   ├── gasconstants -> ../../../primitives/GasConstants
│   ├── hardfork -> ../../../primitives/Hardfork
│   ├── opcode -> ../../../primitives/Opcode
│   ├── rlp -> ../../../primitives/Rlp
│   ├── signature -> ../../../primitives/Signature
│   ├── siwe -> ../../../primitives/Siwe
│   └── state -> ../../../primitives/State
├── crypto/
│   ├── keccak256/index.mdx
│   ├── secp256k1/index.mdx
│   ├── bls12-381.mdx          # Standalone (complex cryptographic primitives)
│   ├── bn254.mdx
│   └── kzg.mdx
└── precompiles/
    ├── ecrecover.mdx
    ├── sha256.mdx
    └── bls12-381/index.mdx

src/primitives/{PascalCase}/    # Colocated docs (source next to code)
├── index.mdx                   # Main overview
├── branded-{name}.mdx          # Functional API
├── constructors.mdx
├── conversions.mdx
├── utilities.mdx
├── validation.mdx
├── usage-patterns.mdx
├── wasm.mdx
├── {name}.ts                   # TS implementation
├── {name}.zig                  # Zig implementation
└── {name}.test.ts
```

**Centralized vs Colocated Decision**:
- **Centralized** (`src/content/docs/primitives/{name}/`): Simpler primitives with ~5-10 doc pages
- **Colocated** (`src/primitives/{Name}/` + symlink): Complex primitives with many pages, benefits from code proximity

---

## COLOCATED DOCUMENTATION PATTERN

### Creating Colocated Docs

1. **Create docs in source directory**:
```
src/primitives/NewPrimitive/
├── index.mdx                  # Main overview
├── branded-newprimitive.mdx   # Functional API
├── constructors.mdx
├── NewPrimitive.ts
└── NewPrimitive.zig
```

2. **Create symlink to Starlight docs**:
```bash
cd src/content/docs/primitives
ln -s ../../../primitives/NewPrimitive newprimitive
```

3. **Verify symlink**:
```bash
ls -la src/content/docs/primitives/newprimitive
# Should show: newprimitive -> ../../../primitives/NewPrimitive
```

**Naming Convention**:
- Source directory: `PascalCase` (e.g., `Abi`, `EventLog`, `AccessList`)
- Symlink target: `lowercase` (e.g., `abi`, `eventlog`, `accesslist`)
- Starlight uses lowercase URLs: `/primitives/abi`, `/primitives/eventlog`

### Existing Colocated Primitives

12 primitives use symlinks:
- `Abi`, `AccessList`, `Authorization`, `Blob`, `Ens`, `EventLog`
- `FeeMarket`, `GasConstants`, `Hardfork`, `Opcode`, `Rlp`, `Signature`
- `Siwe`, `State`

11 primitives centralized:
- `address`, `base64`, `binarytree`, `bloomfilter`, `bytecode`
- `chain`, `denomination`, `hash`, `hex`, `transaction`, `uint`

---

## STARLIGHT CONFIGURATION

### astro.config.mjs

```javascript
export default defineConfig({
  integrations: [
    starlight({
      title: "Voltaire",
      description: "Ethereum primitives and cryptography library for TypeScript and Zig",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/evmts/voltaire" },
        { icon: "x.com", label: "X", href: "https://twitter.com/tevmtools" }
      ],
      sidebar: [
        { label: "Getting Started", link: "/getting-started/" },
        { label: "Core Primitives", autogenerate: { directory: "primitives" } },
        { label: "Cryptography", autogenerate: { directory: "crypto" } },
        // Zig docs (currently not implemented)
        { label: "Zig Overview", link: "/zig/" },
        { label: "Zig Getting Started", link: "/zig/getting-started/" },
        { label: "Zig Contributing", link: "/zig/contributing/" },
        { label: "Zig Primitives", autogenerate: { directory: "zig/primitives" } },
        { label: "Zig Cryptography", autogenerate: { directory: "zig/crypto" } },
        { label: "Zig Precompiles", autogenerate: { directory: "zig/precompiles" } }
      ],
      customCss: ["./src/styles/custom.css"]
    })
  ]
});
```

**Key Points**:
- `autogenerate` reads `src/content/docs/{directory}` and creates sidebar from file structure
- Symlinks are followed transparently by Starlight
- Sidebar order determined by alphabetical file/directory names
- Custom order: rename files with numeric prefixes or manually specify in sidebar config

---

## FRONTMATTER

Every MDX file MUST have frontmatter:

```yaml
---
title: Address
description: 20-byte Ethereum addresses with EIP-55 checksumming
---
```

**Optional fields**:
- `sidebar: { order: 1, label: "Custom Label" }`
- `tableOfContents: false` (disable TOC for that page)
- `template: splash` (full-width landing page)

---

## STARLIGHT COMPONENTS

Import and use Starlight components for rich documentation:

```mdx
import { Tabs, TabItem, Card, CardGrid, Aside, Code } from '@astrojs/starlight/components';

# Address

<Aside type="tip" title="What is an Address?">
An Ethereum address is a 20-byte identifier for accounts and contracts.
</Aside>

<Tabs>
<TabItem label="Class API">
```typescript
const addr = new Address("0x...");
```
</TabItem>
<TabItem label="Namespace API">
```typescript
import * as Address from '@tevm/voltaire/Address';
const addr = Address.from("0x...");
```
</TabItem>
</Tabs>

<CardGrid>
  <Card title="Constructors" icon="rocket">
    Create addresses from hex, bytes, numbers, or public keys.

    [View constructors →](/primitives/address/constructors)
  </Card>

  <Card title="Conversions" icon="document">
    Convert addresses to hex, checksummed, bigint, or ABI-encoded.

    [View conversions →](/primitives/address/conversions)
  </Card>
</CardGrid>
```

**Available Components**:
- `<Tabs>` / `<TabItem>`: Tabbed content (use `syncKey` to sync across tabs)
- `<Card>` / `<CardGrid>`: Card layouts for navigation
- `<Aside>`: Callouts (`type: "note" | "tip" | "caution" | "danger"`)
- `<Code>`: Syntax-highlighted code blocks
- `<FileTree>`: Directory structure visualization

**Icons** (for Cards):
- `rocket`, `document`, `open-book`, `seti:config`, `list-format`
- `bell`, `warning`, `puzzle`, `star`, `pencil`
- See: https://icon-sets.iconify.design/

---

## DOCUMENTATION PAGE STRUCTURE

### Main Overview (`index.mdx`)

Every primitive has a main `index.mdx` with this structure:

```mdx
---
title: Primitive Name
description: Brief one-line description
---

import { Tabs, TabItem, Card, CardGrid, Aside } from '@astrojs/starlight/components';

# Primitive Name

One-sentence overview.

## Overview

2-3 paragraphs explaining:
- What this primitive is
- Why it exists
- Key use cases in Ethereum
- Branded type pattern (link to /primitives/branded-types)

## Quick Start

<Tabs syncKey="api-style">
<TabItem label="Class API">
```typescript
// Simple examples showing class usage
const x = new Thing("input");
x.method();
```
</TabItem>
<TabItem label="Namespace API (Tree-shakeable)">
```typescript
// Same examples with namespace/functional API
import * as Thing from '@tevm/voltaire/Thing';
const x = Thing.from("input");
Thing.method(x);
```
</TabItem>
</Tabs>

## API Documentation

<CardGrid>
  <Card title="Section 1" icon="icon-name">
    Brief description of this API section.

    [View details →](./section-1)
  </Card>

  <Card title="Section 2" icon="icon-name">
    Brief description.

    [View details →](./section-2)
  </Card>
</CardGrid>

## Types

<Tabs>
<TabItem label="Main Type">
```typescript
export type BrandedThing = BaseType & {
  readonly __tag: "Thing";
  // ... other metadata
};
```
</TabItem>
<TabItem label="Related Types">
```typescript
// Supporting types
```
</TabItem>
</Tabs>

## Error Types

```typescript
// Custom error classes
```

## Related

<CardGrid stagger>
  <Card title="Related Primitive" icon="document">
    How it relates.

    [View →](/primitives/related)
  </Card>
</CardGrid>

## Specification References

- [EIP-XXX](https://eips.ethereum.org/EIPS/eip-xxx) - Description
- [External Spec](https://example.com) - Description
```

### Sub-Pages

Each sub-page follows this pattern:

```mdx
---
title: Primitive Name - Sub-Topic
description: Brief description of this sub-topic
---

# Sub-Topic

Brief introduction.

## Method Category

### `Namespace.method(param: Type): ReturnType`

Description of what this method does.

**Parameters:**
- `param: Type` - Description

**Returns:** `ReturnType` - Description

**Throws:** (if applicable)
- `ErrorType` - When this error occurs

**Example:**
```typescript
const result = Namespace.method(input);
// result: expected output
```

**Static form:**
```typescript
Namespace.method(data)
```

**Instance form:**
```typescript
instance.method()
```

Defined in: [path/to/file.ts:line](https://github.com/evmts/voltaire/blob/main/src/path/to/file.ts#Lline)

---

(Repeat for each method)

## Usage Patterns

Common patterns and examples.

## Tree-Shakeable Usage

```typescript
// Import individual functions
import { method1, method2 } from '@tevm/voltaire/Thing'
```
```

---

## WRITING STYLE

### Tone
- **Brief**: 1-2 sentence explanations, expand only when necessary
- **Technical**: Assume Ethereum knowledge, use proper terminology
- **Evidence-based**: Link to EIPs, Yellow Paper, specs
- **No fluff**: Skip "Congratulations!", "Great!", "Amazing!"

### Code Examples
- **Complete**: Runnable code, no `...` placeholders unless showing elision
- **Commented**: Explain non-obvious behavior inline
- **Typed**: Include TypeScript types
- **Both APIs**: Show Class and Namespace forms

### Technical Terms
- Use: "Ethereum", "EVM", "keccak256", "secp256k1", "EIP-55 checksumming"
- Link first mention: `[branded type](/primitives/branded-types)`
- Be precise: "20-byte Uint8Array" not "byte array"

### Structure
- **Progressive disclosure**: Simple examples first, complex patterns later
- **Scannable**: Headers, lists, code blocks
- **Cross-referenced**: Link related docs liberally

---

## ZIG DOCUMENTATION

### Inline Doc Comments

Zig uses `///` for doc comments (extracted by `zig build docs`):

```zig
/// X25519 Elliptic Curve Diffie-Hellman key exchange
/// Re-exports Zig's standard library X25519 implementation
pub const X25519 = crypto.dh.X25519;

/// Generate public key from secret key
pub fn publicKeyFromSecret(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
) ![]u8 {
    // Implementation...
}
```

**Patterns**:
- `///` before declarations (functions, constants, types)
- Brief first line (one-sentence summary)
- Detailed explanation in following lines
- Document parameters, returns, errors inline or in comments
- Link to related functions: "See also: `otherFunction`"

### Zig Test Blocks

Tests are inline, serve as executable documentation:

```zig
test "x25519 basic" {
    const allocator = std.testing.allocator;

    const secret = [_]u8{1} ** SECRET_KEY_SIZE;
    const public_key = try publicKeyFromSecret(allocator, &secret);
    defer allocator.free(public_key);

    try std.testing.expect(public_key.len == PUBLIC_KEY_SIZE);
}
```

### Zig Docs in MDX

Currently, Zig API docs are **NOT auto-generated** into Starlight. Document Zig APIs manually in MDX:

```mdx
## Zig API

### `Address.fromHex(hex_str: []const u8) !Address`

Parse address from hex string.

**Parameters:**
- `hex_str`: Hex string with or without `0x` prefix (40 or 42 chars)

**Returns:** `Address` with 20-byte `bytes` field

**Errors:**
- `error.InvalidHexFormat` - Invalid length
- `error.InvalidHexString` - Non-hex characters

**Example:**
```zig
const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
```

Defined in: [primitives/Address/address.zig:78-91](https://github.com/evmts/voltaire/blob/main/src/primitives/Address/address.zig#L78-L91)
```

**Future**: Generate Zig docs automatically with `zig build docs` and integrate into Starlight

---

## COMMON PATTERNS

### Branded Types

Explain branded type pattern when first mentioned:

```mdx
[Branded](/primitives/branded-types) 20-byte Uint8Array. Runtime is just `Uint8Array`, TypeScript brand prevents mixing with other byte arrays.

```typescript
type BrandedAddress = Uint8Array & { readonly __tag: "Address" };
```

**Benefits**:
- Zero runtime overhead
- Type safety (can't pass `Hash` where `Address` expected)
- Natural serialization (no class wrapper to unwrap)
```

### Dual API (Class + Namespace)

Always show both forms:

```mdx
<Tabs syncKey="api-style">
<TabItem label="Class API">
```typescript
const addr = new Address("0x...");
addr.toHex();
```
</TabItem>
<TabItem label="Namespace API">
```typescript
import * as Address from '@tevm/voltaire/Address';
const addr = Address.from("0x...");
Address.toHex(addr);
```
</TabItem>
</Tabs>
```

### Tree-Shaking

Emphasize bundle size benefits:

```mdx
## Tree-Shaking

Import only what you need:

```typescript
// Import specific functions (tree-shakeable)
import { from, toHex, equals } from '@tevm/voltaire/BrandedAddress'

// Result: keccak256, RLP excluded from bundle if not used
```

**Bundle impact**: Avoiding `toChecksummed()` excludes keccak256 implementation.
```

### WASM

Document WASM availability:

```mdx
## WASM

WASM-accelerated implementation available for browser environments.

```typescript
import { Keccak256Wasm } from '@tevm/voltaire/crypto/keccak256.wasm';
await Keccak256Wasm.init();
const hash = Keccak256Wasm.hash(data);
```

**Build modes**:
- `ReleaseSmall`: Size-optimized (default, production)
- `ReleaseFast`: Performance-optimized (benchmarking)

```bash
zig build build-ts-wasm       # ReleaseSmall
zig build build-ts-wasm-fast  # ReleaseFast
```
```

### Security Considerations

Document security implications:

```mdx
## Security Considerations

### Constant-Time Operations

Comparison operations use constant-time algorithms to prevent timing attacks:

```typescript
// Constant-time comparison (safe)
Hash.equals(hash1, hash2);

// Early-return comparison (UNSAFE - leaks timing)
for (let i = 0; i < 32; i++) {
  if (hash1[i] !== hash2[i]) return false; // ❌ Timing leak
}
```

### Input Validation

Always validate inputs:
- Signature components (r, s in valid range)
- Curve points (on curve, not point at infinity)
- Hash lengths (32 bytes for keccak256)
```

---

## FILE NAMING CONVENTIONS

### TypeScript
- Implementation: `{Name}.ts` (PascalCase, e.g., `Address.ts`)
- Internal methods: `{method}.js` (lowercase, e.g., `toHex.js`)
- Tests: `{name}.test.ts` (lowercase, e.g., `address.test.ts`)
- Benchmarks: `{name}.bench.ts`
- Types: `Branded{Name}.ts` (e.g., `BrandedAddress.ts`)

### Zig
- Implementation: `{name}.zig` (lowercase, e.g., `address.zig`)
- Module root: `root.zig` (exports all primitives)
- Tests: inline in source files
- Benchmarks: `{name}.bench.zig`

### MDX Documentation
- Main overview: `index.mdx`
- Sub-pages: `{topic}.mdx` (lowercase-with-dashes, e.g., `branded-address.mdx`)
- Keep filenames short and descriptive

---

## LINK CONVENTIONS

### Internal Links
- Primitives: `/primitives/address`
- Crypto: `/crypto/keccak256`
- Sections: `/primitives/address/constructors`
- Branded types: `/primitives/branded-types`

### External Links
- EIPs: `https://eips.ethereum.org/EIPS/eip-{number}`
- GitHub source: `https://github.com/evmts/voltaire/blob/main/src/{path}#L{line}`
- Specs: Link directly to authoritative source

### Cross-References
- Link liberally to related docs
- First mention of key concepts should be linked
- Use descriptive link text: `[EIP-55 checksumming](/primitives/address/conversions#checksummed)`

---

## COMMANDS

```bash
# Development
bun run docs:dev              # Start dev server (localhost:4321)
bun run docs:build            # Build production site
bun run docs:preview          # Preview production build

# Verification
ls -la src/content/docs/primitives/  # Check symlinks
zig build check               # Validate everything
```

---

## EXAMPLES TO STUDY

**Best examples of comprehensive docs**:
1. `src/primitives/Abi/index.mdx` - Complete overview with CardGrid
2. `src/content/docs/primitives/address/` - Well-structured sub-pages
3. `src/content/docs/crypto/keccak256/index.mdx` - Thorough crypto doc
4. `src/primitives/Signature/index.mdx` - Colocated docs pattern
5. `src/content/docs/getting-started.mdx` - Top-level architecture intro

**Code examples**:
- `src/primitives/Address/BrandedAddress/` - Functional API organization
- `src/primitives/Abi/` - Complex primitive with sub-namespaces
- `src/crypto/x25519.zig` - Well-documented Zig module

---

## YOUR TASK

The user will specify documentation changes. You should:

1. **Understand the scope**: What primitive/feature is being documented?
2. **Locate relevant files**: Find existing docs or determine where new docs should go
3. **Follow patterns**: Match style and structure of existing docs
4. **Update comprehensively**: Don't just update one file - update all related files
5. **Verify links**: Ensure all internal links work
6. **Check symlinks**: If creating colocated docs, verify symlink exists
7. **Run validation**: `bun run docs:build` to check for errors

**Remember**:
- Brief, technical, evidence-based writing
- Code examples for both Class and Namespace APIs
- Link to source code with line numbers
- Document TypeScript AND Zig APIs when both exist
- Update navigation (CardGrid) on main overview pages
- No fluff, no congratulations, just facts

**Execute the user's docs update request now.**
