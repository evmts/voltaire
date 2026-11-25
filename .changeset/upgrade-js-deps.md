---
"@tevm/voltaire": patch
"voltaire-effect": patch
---

Upgrade JavaScript/TypeScript dependencies and toolchain:

- `@tevm/voltaire`: upgrade runtime dependency `ox` from `^0.11.1` to `^1.9.0` (preserving multiline statement and field-level error semantics in `Siwe.parse`), and upgrade dev toolchain (`typescript@^6.0.3`, `vitest@5.1.2`, `tsup@^9.0.0`, `@biomejs/biome@^2.6.9`).
- `voltaire-effect`: upgrade test/build devDependencies (`vitest@5.1.2`, `vite@^8.3.8`, `@types/node@^26.6.10`); `effect` remains pinned at `4.1.1` as required by `vibelang@0.0.13`.
