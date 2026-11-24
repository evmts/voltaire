import { Smithers as S } from "@smthrs/targets"
import { fileURLToPath } from "node:url"

// Voltaire's incremental build graph. Each target's key is the digest of the
// files and targets it names, so the input closures below are kept tight:
// editing Zig never reruns TypeScript, editing voltaire-effect never reruns
// Zig or @tevm/voltaire, and editing docs or flows reruns neither. Globs are
// package scoped even with a // prefix, so every root closure sets cwd: "//".

const generated = ["**/node_modules/**", "**/.zig-cache/**", "**/zig-out/**", "**/target/**"]

// pnpm install --frozen-lockfile reads every workspace manifest.
const install = S.Filegroup({
  cwd: "//",
  srcs: [
    S.file("//package.json"),
    S.file("//pnpm-lock.yaml"),
    S.file("//pnpm-workspace.yaml"),
    S.glob("//packages/*/package.json"),
    S.glob("//apps/*/package.json")
  ]
})

// Zig, the vendored C crypto (blst, c-kzg-4844) and the Rust crypto_wrappers
// crate the Zig build compiles through Cargo. The checked-in WASM under
// packages/voltaire-zig/wasm is build output staged for TypeScript, not input.
const zig = S.Filegroup({
  cwd: "//",
  srcs: [
    S.file("//build.zig"),
    S.file("//build.zig.zon"),
    S.file("//Cargo.toml"),
    S.file("//Cargo.lock"),
    S.glob("//packages/voltaire-zig/**", { exclude: [...generated, "//packages/voltaire-zig/wasm/**"] }),
    S.glob("//packages/voltaire-c/**", { exclude: generated })
  ]
})

// @tevm/voltaire sources and its tests. Tracked declarations in types/ are
// build:types output and only feed voltaire-effect.
const ts = S.Filegroup({
  cwd: "//",
  srcs: [
    install,
    S.file("//biome.json"),
    S.glob("//packages/voltaire-ts/**", {
      exclude: [...generated, "//packages/voltaire-ts/dist/**", "//packages/voltaire-ts/types/**"]
    }),
    // Committed WASM that tsup copies into dist/wasm and the loaders read.
    S.glob("//packages/voltaire-zig/wasm/**")
  ]
})

const tsTypes = S.Filegroup({ cwd: "//", srcs: [S.glob("//packages/voltaire-ts/types/**")] })

const effect = S.Filegroup({
  cwd: "//",
  srcs: [
    install,
    S.glob("//packages/voltaire-effect/**", {
      exclude: [...generated, "//packages/voltaire-effect/dist/**", "//packages/voltaire-effect/.vibe/**"]
    })
  ]
})

const rust = S.Filegroup({
  cwd: "//",
  srcs: [S.glob("//packages/voltaire-rs/**", { exclude: generated })]
})

const packaging = S.Filegroup({ cwd: "//", srcs: [S.file("//scripts/verify-packaging.mjs")] })

const factorySources = S.Filegroup({ srcs: [S.glob("**", { exclude: ["cache/**", "reports/**"] })] })

const pnpmRunner = S.file("run-pnpm.sh")

const zigEnv = {
  ZIG_GLOBAL_CACHE_DIR: fileURLToPath(new URL("./cache/tools/zig/global", import.meta.url)),
  ZIG_LOCAL_CACHE_DIR: fileURLToPath(new URL("./cache/tools/zig/local", import.meta.url))
}
const zigCommon = {
  bin: S.Host.bin("zig"),
  tools: [S.Host.bin("cargo"), S.Host.bin("rustc"), S.Host.bin("cc")],
  env: zigEnv,
  sandbox: "none" as const,
  timeout: "2h" as const
}
const pnpmCommon = {
  bin: S.Host.bin("sh"),
  tools: [S.Host.bin("pnpm"), S.Host.bin("node")],
  sandbox: "none" as const,
  timeout: "1h" as const
}
const pnpm = (...args: ReadonlyArray<string>) => [".smithers/run-pnpm.sh", ...args]

// Zig: CI's lint job, `zig build` and `zig build test`.
const zigFmt = S.Shell.Test({
  bin: S.Host.bin("zig"),
  args: ["fmt", "--check", "build.zig", "packages/voltaire-zig/src", "packages/voltaire-zig/lib",
    "packages/voltaire-zig/examples"],
  env: zigEnv,
  sandbox: "none",
  timeout: "5m",
  data: [zig]
})
const zigBuild = S.Shell.Build({ ...zigCommon, args: ["build"], data: [zig], outDirs: ["//zig-out"] })
const zigTest = S.Shell.Test({ ...zigCommon, args: ["build", "test"], data: [zig, zigBuild] })
// The WASM @tevm/voltaire's tests load through packages/voltaire-ts/wasm, a
// symlink to the untracked root wasm/. Without it, fork-provider.wasm.test.ts
// runs `zig build build-ts-wasm` itself and races zig-build on target/. Data
// on zig-build serializes the two Cargo builds that share target/.
const wasmBuild = S.Shell.Build({
  ...zigCommon,
  args: ["build", "build-ts-wasm", "build-ts-wasm-fast", "crypto-wasm"],
  data: [zig, zigBuild],
  outDirs: ["//wasm"]
})

// @tevm/voltaire: typecheck, biome lint + format, vitest, tsup bundle.
const tsTypecheck = S.Shell.Test({
  ...pnpmCommon, args: pnpm("--filter", "@tevm/voltaire", "run", "typecheck"), data: [ts, pnpmRunner]
})
const tsLint = S.Shell.Test({
  ...pnpmCommon,
  args: ["-eu", "-c",
    ".smithers/run-pnpm.sh --filter @tevm/voltaire run lint:check && pnpm --filter @tevm/voltaire run format:check"],
  data: [ts, pnpmRunner]
})
const tsTestWasm = S.Shell.Test({
  ...pnpmCommon, args: pnpm("--filter", "@tevm/voltaire", "run", "test:wasm"), data: [ts, wasmBuild, pnpmRunner]
})
// build:dist plus tsup's dist/**/*.d.ts. build:types' tsc pass rewrites the
// tracked types/ tree, so it stays a release step, not a cached target.
const tsBuild = S.Shell.Build({
  ...pnpmCommon,
  args: ["-eu", "-c",
    ".smithers/run-pnpm.sh --filter @tevm/voltaire run build:dist && cd packages/voltaire-ts && NODE_OPTIONS=--max-old-space-size=8192 pnpm exec tsup --dts-only"],
  data: [ts, pnpmRunner],
  outDirs: ["//packages/voltaire-ts/dist"]
})

// vitest's KZG trusted-setup, stress and constant-time assertions are wall
// clock bounded. Ordering after zig-test and ts-build keeps the heaviest jobs
// off the CPU while it runs, and adds no invalidation: wasm-build already keys
// it on the Zig sources, and ts-build shares its TypeScript inputs.
const tsTest = S.Shell.Test({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/voltaire", "run", "test:run"),
  data: [ts, wasmBuild, zigTest, tsBuild, pnpmRunner]
})

// voltaire-effect resolves @tevm/voltaire through its built dist/ and the
// tracked types/, so it depends on ts-build, never on @tevm/voltaire's sources.
const effectInputs = [effect, tsTypes, tsBuild, pnpmRunner]
const effectTypecheck = S.Shell.Test({
  ...pnpmCommon, args: pnpm("--filter", "voltaire-effect", "run", "typecheck"), data: effectInputs
})
const effectFormat = S.Shell.Test({
  ...pnpmCommon, args: pnpm("--filter", "voltaire-effect", "run", "format:check"), data: [effect, pnpmRunner]
})
const effectTest = S.Shell.Test({
  ...pnpmCommon, args: pnpm("--filter", "voltaire-effect", "run", "test:run"), data: effectInputs
})
const effectBuild = S.Shell.Build({
  ...pnpmCommon,
  args: pnpm("--filter", "voltaire-effect", "run", "build"),
  data: effectInputs,
  outDirs: ["//packages/voltaire-effect/dist"]
})

// Publishability of every workspace package, loading each export subpath.
const verifyPackaging = S.Shell.Test({
  ...pnpmCommon,
  args: ["-eu", "-c", ".smithers/run-pnpm.sh --version >/dev/null && node scripts/verify-packaging.mjs --load"],
  data: [install, packaging, tsTypes, tsBuild, effectBuild, pnpmRunner, S.glob("//packages/*/README.md"),
    S.glob("//packages/*/LICENSE")]
})

const rustTest = S.Shell.Test({
  bin: S.Host.bin("cargo"),
  tools: [S.Host.bin("rustc"), S.Host.bin("cc")],
  args: ["test", "--manifest-path", "packages/voltaire-rs/Cargo.toml"],
  sandbox: "none",
  timeout: "1h",
  data: [rust]
})

export const Package = S.Package({
  targets: {
    "install-sources": install,
    "zig-sources": zig,
    "ts-sources": ts,
    "ts-types": tsTypes,
    "effect-sources": effect,
    "rust-sources": rust,
    "factory-sources": factorySources,
    "factory-write": S.FactoryProjection({ mode: "write" }),
    "factory-check": S.FactoryProjection({ mode: "check" }),
    "zig-fmt": zigFmt,
    "zig-build": zigBuild,
    "zig-test": zigTest,
    "wasm-build": wasmBuild,
    "ts-typecheck": tsTypecheck,
    "ts-lint": tsLint,
    "ts-test": tsTest,
    "ts-test-wasm": tsTestWasm,
    "ts-build": tsBuild,
    "effect-typecheck": effectTypecheck,
    "effect-format": effectFormat,
    "effect-test": effectTest,
    "effect-build": effectBuild,
    "verify-packaging": verifyPackaging,
    "rust-test": rustTest
  }
})
