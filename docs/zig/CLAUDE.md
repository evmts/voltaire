# Voltaire Zig Documentation

## Overview

This is the **Zig** documentation for Voltaire — mirroring the TypeScript docs at https://voltaire.tevm.sh.

**Target**: local `docs-zig/` site (Mintlify)

## Key Differences from TypeScript Docs

- All code examples must be Zig (not TypeScript)
- Import patterns: `@import("primitives")`, `@import("crypto")`
- No npm/bun commands - use `zig build` commands
- Zig-specific patterns (defer, error unions, comptime)

## Zig Code Style

```zig
const primitives = @import("primitives");
const Address = primitives.Address;

// Create address from hex
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e") catch |err| {
    // handle error
};

// Convert to hex string
const hex = addr.toHex();
```

## Module Mapping

| TypeScript | Zig |
|------------|-----|
| `import { Address } from '@tevm/voltaire'` | `@import("primitives").Address` |
| `import { Keccak256 } from '@tevm/voltaire/Keccak256'` | `@import("crypto").keccak256` |
| `Address.from(...)` | `Address.from(...)` or `Address.fromHex(...)` |
| `Address.toHex(addr)` | `addr.toHex()` |

## Content Strategy

- 1:1 match with TypeScript docs structure
- Same concepts, same API methods documented
- Only code examples change
- Keep cross-references to EIPs, Yellow Paper, etc.

## Writing Standards

- Use Zig code blocks: ```zig
- Show error handling with `catch` or `try`
- Use `defer` for cleanup patterns
- Demonstrate allocator patterns where relevant
- Show comptime usage where applicable
