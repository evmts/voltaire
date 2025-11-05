# Voltaire Documentation

Starlight documentation for Voltaire.

## Development

```bash
npm run docs:dev
```

Visit http://localhost:4321

## Build

```bash
npm run docs:build
```

## Structure

```
docs/
├── src/
│   ├── content/
│   │   ├── docs/           # Documentation pages
│   │   │   ├── index.mdx   # Homepage
│   │   │   ├── primitives/ # Primitive types
│   │   │   └── crypto/     # Cryptography
│   │   └── config.ts
│   ├── styles/
│   │   └── custom.css      # Custom styling
│   └── env.d.ts
├── public/                  # Static assets
├── astro.config.mjs        # Starlight configuration
└── tsconfig.json
```

## Writing Docs

All doc pages use MDX with Starlight components. Each page should have:

1. **Documentation tab** - API reference and usage
2. **Source Code tab** - Links to implementation

### Example

```mdx
---
title: Address
description: 20-byte Ethereum address
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs syncKey="view">
  <TabItem label="Documentation">
    [Your API docs here]
  </TabItem>
  <TabItem label="Source Code" icon="seti:typescript">
    [Links to source code]
  </TabItem>
</Tabs>
```

## Colocated Docs

Documentation lives alongside source code:
- Main docs: `docs/src/content/docs/`
- Source .md files: `src/**/*.md` (referenced in tabs)
