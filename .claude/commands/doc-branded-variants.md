# Document Branded Denomination Variants

**Priority: MEDIUM**

BrandedGwei/Wei/Ether variants undocumented. Only regular Wei/Gwei/Ether documented.

## Task
Add documentation for Branded* denomination variants.

## Missing Docs
- BrandedWei API (toGwei, toEther, toU256, etc)
- BrandedGwei API (toWei, toEther, toU256, etc)
- BrandedEther API (once implemented)
- Differences between regular vs branded

## Files to Create/Update
1. `src/content/docs/primitives/denomination/branded-wei.mdx`
2. `src/content/docs/primitives/denomination/branded-gwei.mdx`
3. `src/content/docs/primitives/denomination/branded-ether.mdx`
4. Update `src/content/docs/primitives/denomination/index.mdx` with comparison

## Content Needed
- When to use Branded vs regular
- API differences
- Conversion examples between variants
- Performance implications

## Example
```mdx
## BrandedGwei vs Gwei

**Gwei** (namespace):
\`\`\`typescript
import * as Gwei from '@tevm/voltaire/Gwei';
Gwei.toWei("21"); // Converts any input
\`\`\`

**BrandedGwei** (typed):
\`\`\`typescript
import * as BrandedGwei from '@tevm/voltaire/BrandedGwei';
const gwei = BrandedGwei.from("21");
BrandedGwei._toWei.call(gwei); // Must be branded type
\`\`\`
```

## Verification
```bash
bun run docs:dev
```
