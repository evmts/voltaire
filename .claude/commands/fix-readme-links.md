# Fix README Broken Links

**Priority: MEDIUM**

README.md has 100+ broken links to non-existent .md files.

## Task
Fix all broken documentation links in README.md.

## Issue
Links reference files like:
- `./src/primitives/Address/Address.js.md` (doesn't exist)
- `./src/primitives/Address/BrandedAddress/index.ts.md` (wrong format)

Should reference actual docs:
- `./src/content/docs/primitives/address/index.mdx`
- `./src/content/docs/primitives/address/branded-address.mdx`

## Steps
1. Read README.md
2. Find all links matching pattern `./src/primitives/**/*.md`
3. Map to actual documentation locations in `src/content/docs/`
4. Update links
5. For undocumented primitives, either:
   - Remove link, or
   - Link to source file with note "docs coming soon"

## Pattern
```markdown
<!-- Before -->
[Address.js](./src/primitives/Address/Address.js.md)

<!-- After -->
[Address](./src/content/docs/primitives/address/index.mdx)
```

## Verification
Check all links resolve:
```bash
# Manual verification or use link checker
bun run docs:build
```
