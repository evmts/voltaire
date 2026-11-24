# JS toolchain upgrade plan

Verified 2026-11-22 against `packages/voltaire-ts` (`@tevm/voltaire`) and `packages/voltaire-effect`, using the registry and the real tool binaries.

> **Status 2026-11-24.** Two blockers below are gone. voltaire-effect moved to Effect 4.1.1, `@effect/vitest` 4.1.1, and vitest 5.0.5 (VibeLang rewrite), so its rows and the `EFFECT_V4_MIGRATION.md` reference are history. `ci.yml` now runs Node 22; `build-native.yml` and `deploy-playground.yml` still pin Node 20. `@tevm/voltaire` is still on TypeScript 5.9, vitest 4.0.16, and tsup 8.5; Biome is at 2.6.8.

## Summary

Both packages now typecheck with zero errors under TypeScript 7.0.2, but the TS 7 swap is blocked by tools that need the TypeScript JS API (tsup dts, typedoc). tsup 9 builds both packages today. vitest 5 and tsup 9 are blocked by CI running Node 20.

TypeScript 7 ships only a native `tsc` binary. `require("typescript")` returns `{ version, versionMajorMinor }` and nothing else. tsup 9.0.0 and typedoc 0.28.20 both need the full compiler API, so `typescript` must stay at 5.9.x or 6.0.x as a library while TS 7 runs as a separate type checker. Three CI facts gate the rest. `ci.yml` pins Node 20, but vitest 5 needs Node ^22.12 and tsup 9 needs Node ^22.18. voltaire-effect's vitest 5 path requires `@effect/vitest` 4.x, which requires Effect 4.

## Versions verified

| Tool | Current (installed) | Latest on npm | Verdict |
| --- | --- | --- | --- |
| typescript | 5.9.3 | 7.0.2 (`latest`), 6.0.3, 7.1.0-beta | BLOCKED (tool APIs). Typecheck is clean. |
| vitest (voltaire-ts) | 4.0.16 | 5.1.1 (`latest`), 4.1.12 (`V4`) | BLOCKED (CI Node 20) |
| vitest (voltaire-effect) | 2.1.9 | 5.1.1 | BLOCKED (`@effect/vitest` peer + Effect 4) |
| @vitest/coverage-v8 | 4.0.16 / 2.1.9 | 5.1.1 | Moves in lockstep with vitest |
| tsup | 8.5.1 (both) | 9.0.0 (2026-10-14) | BLOCKED (CI Node 20). Builds pass on Node 26. |
| tsdown | not used | 0.23.7 | DEFER (successor that supports TS 7) |
| @effect/vitest | 0.27.0 | 4.1.5 (`latest`), 0.30.1 (`prev`) | BLOCKED (Effect 4) |
| effect | 3.19.13 | 4.1.5, 3.22.5 (`prev`) | Owned by `EFFECT_V4_MIGRATION.md` |
| typedoc | 0.28.15 | 0.28.20 | SAFE NOW (peer TS ≤ 6.0.x; blocks TS 7) |
| @biomejs/biome | 2.3.10 | 2.6.8 | DEFER (out of scope, UNVERIFIED) |
| @tevm/tsconfig | 1.0.0-next.142 | next.142 (`latest`), rc.151 | Current |
| @tevm/tsupconfig | 1.0.0-next.148 | next.148 (`latest`), rc.151 | Current |

Peer and engine constraints from the registry:

| Package | Constraint |
| --- | --- |
| typescript@7.0.2 | `bin: { tsc }`, `exports["."] = ./lib/version.cjs`; API only under `typescript/unstable/*` (`sync`, `async`, `ast`, `fs`, `proto`) |
| tsup@9.0.0 | `engines.node ^22.18.0 \|\| ^24.11.0 \|\| >=26.0.0`; peer `typescript >=4.5.0` |
| vitest@5.1.1 | `engines.node ^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; peer `vite ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` (vite is now a peer, not a dependency) |
| @effect/vitest 0.27.0 – 0.30.0 | peer `vitest ^3.2.0` |
| @effect/vitest 0.30.1 | peer `vitest ^3.2.0 \|\| ^4.0.0`, `effect ^3.22.4` |
| @effect/vitest 4.1.5 | peer `vitest >=5.0.0 <6.0.0`, `effect ^4.1.5` |
| typedoc@0.28.20 | peer `typescript 5.0.x – 5.9.x \|\| 6.0.x` |
| tsdown@0.23.7 | peer `typescript ^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0` |
| @typescript/typescript6@6.0.2 | TS 6 compiler API compatibility package, bin `tsc6` |

## Baseline (installed toolchain)

| Command | Result |
| --- | --- |
| `pnpm --filter @tevm/voltaire typecheck` | 0 errors, 30.1 s wall |
| `pnpm --filter voltaire-effect typecheck` | 0 errors, 28.7 s wall |
| `pnpm --filter @tevm/voltaire test:run src/primitives/Address` | 883 tests: 803 passed, 80 failed |
| Same, after the fixes below, filters `Address evm/Host Abi Hash` | 3136 tests: 2968 passed, 126 failed, 42 skipped; type errors: none |
| `pnpm --filter voltaire-effect test:run src/primitives/Hex` | 1 file failed to load: `@tevm/voltaire/Hex` not resolvable |

All 126 voltaire-ts failures are in `*.wasm.test.ts` files: `Address.wasm.test.ts` (80), `Hash.wasm.test.ts` (46), and `Abi/wasm.test.ts` (load error). The cause is `ENOENT .../wasm/primitives.wasm` and `WASM module not loaded`, because this checkout has no `zig build build-ts-wasm` output. `vitest.setup.ts` skips loading when the file is missing, so these tests fail instead of skipping. voltaire-effect tests import `@tevm/voltaire/*` subpaths, which resolve to `dist/`, so `pnpm --filter @tevm/voltaire build:dist` must run first. CI already has voltaire-effect `test:run` commented out (`voltaire-effect-ci.yml:40`).

## TypeScript 7.0.2

### Evidence

`npm install --no-save --prefix $TMP typescript@7.0.2` installs 31 MB: the JS shim and `@typescript/typescript-darwin-arm64`. `tsc -v` reports `Version 7.0.2`. Run: `$TMP/node_modules/.bin/tsc -p tsconfig.json --noEmit --pretty false` from each package directory.

| Run | voltaire-ts | voltaire-effect |
| --- | --- | --- |
| 1 (unchanged tree) | 1 error: TS1003 `Hash/Hash.js:8`. The parse error hid every later error. | 8 errors: TS2591 ×7, TS7006 ×1 |
| 2 (after Hash.js and `types` fix) | 40 errors: TS7006 ×14, TS1005 ×11, TS2694 ×11, TS2344 ×4 | 0 errors |
| 3 (after all fixes) | **0 errors** | **0 errors** |
| Wall time, full check | 3.4 s | 4.5 s |

TS 7 reported no TS5xxx option errors. Neither tsconfig, nor `@tevm/tsconfig/base.json` (`module/moduleResolution: NodeNext`, `target: ESNext`, `allowJs` + `checkJs`), uses an option that TS 7 removed. Neither uses `baseUrl`, `moduleResolution: node`, `target: es5`, `downlevelIteration`, or `importsNotUsedAsValues`.

### Root causes found and fixed (all valid under TS 5.9.3)

| Code | Sites | Cause | Fix |
| --- | --- | --- | --- |
| TS1003 | `primitives/Hash/Hash.js:8` | `{import(./HashType.js')...}` has a missing quote. TS 5.9 never reported it because the file is `@ts-nocheck`. TS 7 reports JSDoc parse errors in nocheck files. | Added the quote. |
| TS2591, TS7006 | `voltaire-effect/.../BlockExplorerApi.ts` ×7, `IpcTransport.ts` ×1 | TS 6+ defaults `types` to `[]`, so `@types/node` is no longer included automatically. `process` and `node:net` are unresolved. | Added `"types": ["node"]` to `packages/voltaire-effect/tsconfig.json`. |
| TS1005 | `evm/Host/from.js` ×10, `Address/calculateCreate2Address.js` ×1 | TS 7 does not parse the Closure JSDoc type `function(A, B): R`. | Rewrote as `(a: A, b: B) => R`. |
| TS7006 | `evm/Host/createMemoryHost.js` ×14 | Follows from the `from.js` parse failure: the callbacks lost their contextual types. | Fixed by the `from.js` rewrite. |
| TS2344 | `Address/AddressClass.ts` ×4 | Follows from the `calculateCreate2Address.js` parse failure: its return type collapsed to `Function`. | Fixed by the rewrite. |
| TS2694 | `Abi/decodeLog.js` ×6, `decodeFunction.js`, `encodeConstructor.js`, `encodeFunction.js`, `getFunctionBySelector.js`, `parseLogs.js` | Value-as-type in JSDoc: `import('./Abi.js').Abi` names the `Abi` function, and `import('./event/index.js').Event` names a const. TS 7 drops the JS value-as-type fallback. The committed `types/primitives/Abi/decodeFunction.d.ts` already emits `abi: import("./Abi.js").Abi`, a broken public type. | Changed to `import('./AbiType.js').AbiType` and `import('./event/index.js').EventType`. |

### Blockers

| Blocker | Evidence |
| --- | --- |
| No compiler API at `typescript` | `require('typescript')` in 7.0.2 returns `['version','versionMajorMinor']`; `createProgram` and `transpileModule` are `undefined`. |
| tsup dts (`voltaire-effect` `dts: true`; voltaire-ts `build:types` runs `tsup --dts-only`) | tsup 9.0.0 + typescript 7.0.2: `Error: rollup-plugin-dts requires the TypeScript compiler API ... install @typescript/typescript6`. Adding `@typescript/typescript6@6.0.2` then fails in tsup's own code: `TypeError: _typescript2.default.parseJsonConfigFileContent is not a function` (`tsup/dist/rollup.js:9978`). tsup has no TS 7 path. |
| typedoc | 0.28.20 peer stops at `6.0.x`. |
| vitest `typecheck.enabled` (`**/*.test-d.ts`) | Spawns `tsc`. UNVERIFIED with TS 7. |

### Safe today

- Keep the source and tsconfig fixes above. They are green on 5.9.3 and 7.0.2.
- Run TS 7 as a check-only CI gate beside 5.9.3. The gate needs no package.json change: `npx -p typescript@7.0.2 tsc -p packages/voltaire-ts/tsconfig.json --noEmit` (and the same for voltaire-effect). How to declare it as a devDependency without the `tsc` bin colliding with `typescript@5.9.3` is UNVERIFIED.

### Checklist

- [ ] Add the TS 7.0.2 check-only gate to CI for both packages.
- [ ] Ban Closure `function(...)` JSDoc types and JSDoc value-as-type (lint rule or review rule). Both pass on 5.9 and break on 7.
- [ ] Evaluate `typescript@6.0.3` as the library version for tsup and typedoc (UNVERIFIED; not run because of disk limits).
- [ ] Replace tsup dts with a TS 7-capable bundler (tsdown 0.23.7 peers `typescript ^7`), or emit declarations with `tsc` 7 directly. Both are UNVERIFIED.
- [ ] Wait for typedoc to support TS 7, or keep typedoc on a 5.9/6.0 `typescript`.
- [ ] Switch `typescript` to 7.x only after both of the previous items land.

## vitest 5.1.1

### Evidence

vitest 5.1.1 was **not executed**. Free disk fell from 12 GB to 5.4 GB during the audit, below the 6 GB install floor, so the vitest 5 config-load run is UNVERIFIED. The analysis below comes from the v5.1.1 migration guide (`docs/guide/migration/index.md@v5.1.1`), `packages/vitest/src/node/types/{config,coverage}.ts@v5.1.1`, and repo greps.

| v5 change | Repo exposure |
| --- | --- |
| Node ^22.12 | **Blocker:** `.github/workflows/ci.yml:131` uses `node-version: '20'` for the test job. |
| `vite` is a peer (^6.4 \|\| ^7 \|\| ^8) | vitest 4.0.16 currently resolves vite 7.3.0. pnpm auto-installs peers. |
| `clearMocks` defaults to `true` | UNVERIFIED. Needs a full suite run. |
| Unawaited `resolves`/`rejects` fail | 39 sites in voltaire-ts, 11 in voltaire-effect. 0 lack `await`/`return`. |
| `test/describe.sequential` removed | 0 sites |
| `toThrow("")` semantics | 0 sites |
| Top-level `bench` import removed | 0 sites. 126 `*.bench.ts` files exist, but none import from `vitest`. |
| `VITEST_POOL_ID`/`WORKER_ID` 1-based | 0 sites |
| Removed entrypoints (`vitest/coverage`, `/reporters`, `/environments`, `/snapshot`, `/runners`, `/suite`, `/mocker`) | 0 sites |
| `Assertion<T>` → `Assertion<R, T>`, `jest.Matchers` | 0 sites |
| `pretty-format` replaces `loupe` | 1 test file uses `toMatchSnapshot`/`toMatchInlineSnapshot`. 0 `*.snap` files. |
| Coverage `include`/`exclude` now project-relative and without `contains` | `coverage.include: ["src/**/*.ts"]` is already relative. The reported file set may shrink. UNVERIFIED. |
| `json` reporter writes `.vitest/json/output.json` | `coverage.reporter` includes `json`, but that is a coverage reporter, not a test reporter. Add `.vitest` to `.gitignore`. |
| `thresholds.autoUpdate`, `reportOnFailure`, `server.deps`, `typecheck`, `benchmark.include` | Still present in v5 config types |

### Existing defect (vitest 4, today)

`packages/voltaire-ts/vitest.config.ts` sets `poolOptions.threads.{maxThreads,minThreads}: 1`. vitest 4.0.16 ignores it and prints `DEPRECATED  test.poolOptions was removed in Vitest 4`, so the suite already runs with the default worker count. The v4 equivalent is the top-level `maxWorkers: 1`. Not changed here: restoring single-worker execution changes suite runtime and behavior, and the owner must decide. The `benchmark.include: ["comparisons/**/*.bench.ts"]` target directory does not exist.

### voltaire-effect: vitest 2.1.9 → 4 or 5

| Step | Constraint |
| --- | --- |
| Today | `@effect/vitest@0.27.0` peers `vitest ^3.2.0`, but vitest 2.1.9 is installed. The peer is already violated. |
| → vitest 4 | Needs `@effect/vitest@0.30.1`, which needs `effect ^3.22.4` (installed: 3.19.13). |
| → vitest 5 | Needs `@effect/vitest@4.x`, which needs `effect ^4.1.5`. Gated on the Effect v4 migration. |
| Tests | 177 files import `@effect/vitest`; 26 import `vitest`. |

`packages/voltaire-effect/vitest.setup.ts` resolves `../wasm/primitives.wasm` and `../src/wasm-loader/loader.js` relative to `packages/voltaire-effect`. Neither path exists, so the block never runs.

### Checklist

- [ ] Bump `ci.yml` test job to Node 22 or later (≥ 22.18 to cover tsup 9 too).
- [ ] Replace `poolOptions` in `packages/voltaire-ts/vitest.config.ts` with `maxWorkers` (owner chooses the value).
- [ ] Build WASM in local verification (`zig build build-ts-wasm`) so `*.wasm.test.ts` run instead of failing.
- [ ] voltaire-ts: bump vitest + coverage-v8 to 4.1.12 (UNVERIFIED), then to 5.1.1; run `pnpm test:run` and diff pass counts for `clearMocks` fallout.
- [ ] Add `.vitest` to `.gitignore`.
- [ ] voltaire-effect: bump effect to ^3.22.4, `@effect/vitest` to 0.30.1, vitest to 4.x; build `@tevm/voltaire` dist; re-enable `test:run` in `voltaire-effect-ci.yml`.
- [ ] voltaire-effect → vitest 5 after the Effect 4 migration (`@effect/vitest` 4.x).

## tsup 9.0.0

### Evidence

tsup 9.0.0 exists (published 2026-10-14). Its changelog lists one breaking change, "Migrate to obug, drop node < 22.18", plus an esbuild/chokidar upgrade, an exported `Plugin` type, and "Remove `baseUrl` in tsconfig". Neither tsup config nor `@tevm/tsupconfig` (`createTsUpOptions`: `entry`, `outDir`, `target`, `format`, `splitting`, `treeshake`, `sourcemap`, `clean`, `skipNodeModulesBundle`) uses a removed option.

| Run (tsup 9.0.0 from temp install, Node 26.10.0, output to temp dir) | Result |
| --- | --- |
| voltaire-effect `tsup` (ESM + `dts: true`), typescript 5.9.3 | exit 0; ESM 8.5 s, DTS 77.7 s; 15 outputs. One rollup-plugin-dts warning: `index.d.ts` references private types (`ChaCha20Poly1305Error`, `CryptoError`, `KeccakServiceShape`, …) with no public re-export, so downstream TS2742 is possible. |
| voltaire-ts `tsup` (`build:dist`, ESM + CJS) | exit 0; 53.7 s; 332 outputs; 65 MB. Warnings: 9 CJS entries mix named and default exports (`evm/Host`, `evm/Frame`, `crypto/Keystore`, `primitives/{Address,Hex,PrivateKey,State,Signature,Transaction}`). |
| voltaire-ts `tsup --dts-only` | UNVERIFIED (not run). |
| voltaire-effect `tsup --dts-only`, typescript 7.0.2 | Fails (see TypeScript blockers). |

### Blockers

| Blocker | Evidence |
| --- | --- |
| Node ≥ 22.18 | `ci.yml:131` uses Node 20 (`build:dist`, `build:types`). `voltaire-effect-ci.yml:21` uses `'22'`, which resolves to the latest 22.x. |
| TS 7 | tsup 9 calls `typescript.parseJsonConfigFileContent` directly. |

### Checklist

- [ ] Bump the CI Node version (shared with vitest 5).
- [ ] Bump tsup to ^9.0.0 in both packages; run `build:dist`, `build:types`, and voltaire-effect `build`.
- [ ] Re-export the private types named in the dts warning from a public voltaire-effect entry.
- [ ] For TS 7: evaluate tsdown 0.23.7 (Node ^22.18, peer TS ^7). Its tsup-config parity is UNVERIFIED.

## Verification gates

These commands must stay green for every bump:

```bash
pnpm --filter @tevm/voltaire typecheck
pnpm --filter voltaire-effect typecheck
npx -p typescript@7.0.2 tsc -p packages/voltaire-ts/tsconfig.json --noEmit
npx -p typescript@7.0.2 tsc -p packages/voltaire-effect/tsconfig.json --noEmit
zig build build-ts-wasm && pnpm test:run
zig build test
```
