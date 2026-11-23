---
"@tevm/voltaire": patch
"@tevm/zig": patch
"voltaire-effect": patch
---

Prepare for the Zig 0.17, TypeScript 7, and Effect 4 upgrades without changing the supported toolchain. `build.zig` now links through `root_module` (the `Step.Compile` helpers are removed in Zig 0.17) and follows `CARGO_TARGET_DIR`. JSDoc types that TypeScript 7 rejects are rewritten, so both packages typecheck on TypeScript 5.9.3 and 7.0.2. Migration guides: `docs/MIGRATION_ZIG_017.md`, `docs/TOOLCHAIN_UPGRADE_PLAN.md`, `packages/voltaire-effect/EFFECT_V4_MIGRATION.md`.
