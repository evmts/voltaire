# Changelog

All notable changes to this project will be documented in this file.

## 0.1.15 - 2025-12-30

- Fix: Add KZG env import stubs in `src/wasm-loader/loader.ts` to make WASM instantiation robust across test runners and environments.
- Fix: Implement deterministic `signatureIsCanonical(r, s)` check in TypeScript to avoid discrepancies with WASM builds and stabilize tests.
- Chore: Add `publishConfig.access: public` and `engines.node: >=18` to `package.json` to ensure correct scoped package publishing and runtime requirements.
- Chore: Add `prepublishOnly` script to run build, package lint, and tests before publishing.

