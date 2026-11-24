---
"@tevm/voltaire": patch
---

Install fewer packages with `@tevm/voltaire`. Remove Sandpack and Monaco from the runtime dependencies, drop the unused `@shazow/whatsabi` dependency, and move the test-only `@noble/secp256k1` to `devDependencies`. A fresh `npm install @tevm/voltaire` now adds 19 packages instead of 82. See [issue #391](https://github.com/evmts/voltaire/issues/391).
