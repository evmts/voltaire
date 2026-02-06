# Document 12 Missing Primitives

**Priority: HIGH**

12 primitives lack documentation.

## Task
Create colocated documentation for undocumented primitives.

## Missing Docs
Abi, AccessList, Authorization, Blob, EventLog, FeeMarket, GasConstants, Hardfork, Opcode, Rlp, Siwe, State

## Pattern (per CLAUDE.md)
1. Create `src/primitives/{PascalCase}/index.mdx`
2. Symlink: `src/content/docs/primitives/{lowercase} → ../../../primitives/{PascalCase}`

## Each Doc Should Include
- Overview/purpose
- Type definition
- Core methods with examples
- Common use cases
- Related primitives

## Template
```mdx
---
title: {PrimitiveName}
description: {One-line description}
---

# {PrimitiveName}

{Overview paragraph}

## Type Definition
\`\`\`typescript
export type Branded{Name} = ...
\`\`\`

## Core Methods

### from()
{Description}
\`\`\`typescript
{Example}
\`\`\`

### toHex()
{Description}
\`\`\`typescript
{Example}
\`\`\`

## Use Cases
- {Use case 1}
- {Use case 2}
```

## Do Incrementally
Start with most important: Abi, AccessList, Authorization, Blob.

## Verification
```bash
bun run docs:dev
# Check localhost:4321/primitives/{name}
```
