---
title: Colocated Documentation Pattern
description: How to add colocated Zig documentation
---

# Colocated Zig Documentation Pattern

Zig documentation uses a colocated pattern: MDX files live alongside `.zig` source files and are symlinked into the Starlight docs structure.

## Structure

```
src/
├── primitives/
│   ├── address.zig              # Source code
│   └── address.mdx              # Documentation (colocated)
├── crypto/
│   ├── secp256k1.zig            # Source code
│   └── secp256k1.mdx            # Documentation (colocated)
└── content/docs/zig/
    ├── primitives/address/
    │   └── index.mdx → ../../../../../primitives/address.mdx
    └── crypto/secp256k1/
        └── index.mdx → ../../../../../crypto/secp256k1.mdx
```

## Adding New Documentation

### 1. Create MDX file alongside source

Create `src/primitives/yourmodule.mdx` or `src/crypto/youralgo.mdx`:

```mdx
---
title: YourModule
description: Brief description
---

# YourModule

Documentation content...
```

### 2. Create symlink to docs directory

**For primitives**:
```bash
mkdir -p src/content/docs/zig/primitives/yourmodule
ln -sf ../../../../../../primitives/yourmodule.mdx \
  src/content/docs/zig/primitives/yourmodule/index.mdx
```

**For crypto**:
```bash
mkdir -p src/content/docs/zig/crypto/youralgo
ln -sf ../../../../../../crypto/youralgo.mdx \
  src/content/docs/zig/crypto/youralgo/index.mdx
```

**For precompiles**:
```bash
mkdir -p src/content/docs/zig/precompiles/yourprecompile
ln -sf ../../../../../../precompiles/yourprecompile.mdx \
  src/content/docs/zig/precompiles/yourprecompile/index.mdx
```

### 3. Verify

```bash
# Check symlink
ls -la src/content/docs/zig/primitives/yourmodule/

# Test docs server
bun run docs:dev
```

## Benefits

- **Single source of truth**: Documentation lives with code
- **Easy maintenance**: Update docs when modifying code
- **Clear ownership**: Each module owns its documentation
- **Version control**: Docs and code versioned together
- **DRY principle**: No duplication between source and docs

## Frontmatter Template

```yaml
---
title: Module Name
description: One-line description for sidebar/SEO
---
```

## Content Guidelines

Include:
- **Overview**: Purpose and capabilities
- **Key Functions**: Main API with code examples
- **Types**: Data structures and their fields
- **Examples**: Common use cases
- **Performance**: Benchmark results
- **Testing**: How to run tests
- **Related**: Links to related modules
- **References**: Specs, EIPs, papers

## Examples

See existing documentation:
- `src/primitives/address.mdx`
- `src/crypto/secp256k1.mdx`
