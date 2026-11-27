import { Smithers as S } from "@smthrs/targets"
import { fileURLToPath } from "node:url"

// Voltaire's incremental Smithers 1.0 build, test, docs, wiki, and Lighthouse
// backpressure graph. Every target's cache key is the digest of the files,
// targets, and host binaries it names: editing Zig never reruns TypeScript,
// and editing wiki or factory files reruns neither Zig nor TypeScript.
// Globs are package scoped even with a // prefix, so root closures set cwd: "//".

const generated = ["**/node_modules/**", "**/.zig-cache/**", "**/zig-out/**", "**/target/**", "**/.uphill/**"]

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

// Zig, vendored C crypto (blst, c-kzg-4844), and Rust crypto_wrappers crate.
const zig = S.Filegroup({
  cwd: "//",
  srcs: [
    S.file("//build.zig"),
    S.file("//build.zig.zon"),
    S.file("//Cargo.toml"),
    S.file("//Cargo.lock"),
    S.glob("//packages/voltaire-zig/**", { exclude: [...generated, "//packages/voltaire-zig/wasm/**"] })
  ]
})

// @tevm/voltaire sources and tests.
const ts = S.Filegroup({
  cwd: "//",
  srcs: [
    install,
    S.file("//biome.json"),
    S.glob("//packages/voltaire-ts/**", {
      exclude: [...generated, "//packages/voltaire-ts/dist/**", "//packages/voltaire-ts/types/**"]
    }),
    S.glob("//packages/voltaire-zig/wasm/**")
  ]
})

const tsTypes = S.Filegroup({ cwd: "//", srcs: [S.glob("//packages/voltaire-ts/types/**")] })

const playgroundSources = S.Filegroup({
  cwd: "//",
  srcs: [
    install,
    S.glob("//apps/playground/**", { exclude: [...generated, "//apps/playground/dist/**"] })
  ]
})

const docsSources = S.Filegroup({
  cwd: "//",
  srcs: [
    S.file("//README.md"),
    S.file("//CLAUDE.md"),
    S.file("//CONTRIBUTING.md"),
    S.glob("//docs/**"),
    S.glob("//packages/voltaire-ts/docs/**"),
    S.glob("//packages/voltaire-zig/docs/**")
  ]
})

const packaging = S.Filegroup({
  cwd: "//",
  srcs: [S.file("//scripts/verify-packaging.mjs"), S.file("//scripts/publish-npm.mjs")]
})

const factorySources = S.Filegroup({
  srcs: [S.glob("**", { exclude: ["cache/**", "reports/**", "node_modules/**", "data/**", "logs/**"] })]
})

const wikiSources = S.Filegroup({
  cwd: "//",
  srcs: [
    S.file("//.smithers/coding-project.json"),
    S.glob("//.smithers/wiki/**"),
    S.file("//scripts/publish-feeds.mjs")
  ]
})

const mythicalSources = S.Filegroup({
  cwd: "//",
  srcs: [S.glob("//.smithers/mythical/**")]
})

const uphillSources = S.Filegroup({
  cwd: "//",
  srcs: [
    S.glob("//.agents/uphill/**"),
    S.file("//scripts/audit-report.mjs")
  ]
})

const authSources = S.Filegroup({
  cwd: "//",
  srcs: [S.file("//.mcp.json"), S.file("//scripts/smthrs"), S.file("//scripts/smthrs-auth.mjs")]
})

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
const nodeCommon = {
  bin: S.Host.bin("node"),
  tools: [S.Host.bin("bun"), S.Host.bin("sh")],
  sandbox: "none" as const,
  timeout: "15m" as const
}
const pnpm = (...args: ReadonlyArray<string>) => [".smithers/run-pnpm.sh", ...args]

// --- Zig, C99 ABI, and WASM targets ----------------------------------------

const zigFmt = S.Shell.Test({
  bin: S.Host.bin("zig"),
  args: [
    "fmt",
    "--check",
    "build.zig",
    "packages/voltaire-zig/src",
    "packages/voltaire-zig/lib",
    "packages/voltaire-zig/examples"
  ],
  env: zigEnv,
  sandbox: "none",
  timeout: "5m",
  data: [zig]
})

const zigBuild = S.Shell.Build({ ...zigCommon, args: ["build"], data: [zig], outDirs: ["//zig-out"] })
const zigTest = S.Shell.Test({ ...zigCommon, args: ["build", "test"], data: [zig, zigBuild] })

const cApiBuild = S.Shell.Build({
  ...zigCommon,
  args: ["build", "-Dwith-c-api=true", "-Doptimize=ReleaseFast"],
  data: [zig, zigBuild],
  outDirs: ["//zig-out"]
})

const cApiSmoke = S.Shell.Test({
  bin: S.Host.bin("sh"),
  tools: [S.Host.bin("zig"), S.Host.bin("cc")],
  env: zigEnv,
  sandbox: "none",
  timeout: "30m",
  args: [
    "-eu",
    "-c",
    "test -f zig-out/include/primitives.h && test -f zig-out/lib/libprimitives_c.a && cc -Izig-out/include packages/voltaire-zig/examples/c/basic_usage.c -Lzig-out/lib -Wl,-rpath,\"$PWD/zig-out/lib\" -lprimitives_c -o .smithers/cache/voltaire_c_smoke && .smithers/cache/voltaire_c_smoke"
  ],
  data: [zig, cApiBuild]
})

const wasmBuild = S.Shell.Build({
  ...zigCommon,
  args: ["build", "build-ts-wasm", "build-ts-wasm-fast", "crypto-wasm"],
  data: [zig, zigBuild],
  outDirs: ["//wasm"]
})

// --- TypeScript, Docs, Playground, and Packaging targets -------------------

const tsTypecheck = S.Shell.Test({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/voltaire", "run", "typecheck"),
  data: [ts, pnpmRunner]
})

const tsLint = S.Shell.Test({
  ...pnpmCommon,
  args: [
    "-eu",
    "-c",
    ".smithers/run-pnpm.sh --filter @tevm/voltaire run lint:check && pnpm --filter @tevm/voltaire run format:check"
  ],
  data: [ts, pnpmRunner]
})

const tsTestWasm = S.Shell.Test({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/voltaire", "run", "test:wasm"),
  data: [ts, wasmBuild, pnpmRunner]
})

const tsBuild = S.Shell.Build({
  ...pnpmCommon,
  args: [
    "-eu",
    "-c",
    ".smithers/run-pnpm.sh --filter @tevm/voltaire run build:dist && cd packages/voltaire-ts && NODE_OPTIONS=--max-old-space-size=8192 pnpm exec tsup --dts-only"
  ],
  data: [ts, pnpmRunner],
  outDirs: ["//packages/voltaire-ts/dist"]
})

const tsTest = S.Shell.Test({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/voltaire", "run", "test:run"),
  data: [ts, wasmBuild, zigTest, tsBuild, pnpmRunner]
})

const docsCheck = S.Shell.Test({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/voltaire", "exec", "vitest", "run", "docs/docs-index.test.ts"),
  data: [install, docsSources, pnpmRunner]
})

const playgroundBuild = S.Shell.Build({
  ...pnpmCommon,
  args: pnpm("--filter", "@tevm/playground", "run", "build"),
  data: [playgroundSources, tsBuild, pnpmRunner],
  outDirs: ["//apps/playground/dist"]
})

const verifyPackaging = S.Shell.Test({
  ...pnpmCommon,
  args: ["-eu", "-c", ".smithers/run-pnpm.sh --version >/dev/null && node scripts/verify-packaging.mjs --load"],
  data: [
    install,
    packaging,
    tsTypes,
    tsBuild,
    pnpmRunner,
    S.glob("//packages/*/README.md"),
    S.glob("//packages/*/LICENSE")
  ]
})

// --- Factory, Home, Wiki, Mythical History, and Lighthouse Audit targets ---

const factoryWrite = S.Shell.Build({
  bin: S.Host.bin("sh"),
  tools: [S.Host.bin("node")],
  sandbox: "none",
  timeout: "5m",
  cache: false,
  args: ["scripts/smthrs", "target", "//.smithers:factory-check", "--write"],
  outFiles: ["//.smithers/factory.json"],
  data: [S.file("//.smithers/FACTORY.ts"), S.file("//scripts/smthrs")]
})

const homeWrite = S.Shell.Build({
  ...nodeCommon,
  args: ["scripts/project-home.mjs", "--write"],
  cache: false,
  outFiles: ["//.smithers/home.json"],
  data: [S.file("//.smithers/HOME.ts"), S.file("//scripts/project-home.mjs")]
})

const homeCheck = S.Shell.Test({
  ...nodeCommon,
  args: ["scripts/project-home.mjs", "--check"],
  data: [S.file("//.smithers/HOME.ts"), S.file("//.smithers/home.json"), S.file("//scripts/project-home.mjs")]
})

const wikiCheck = S.Shell.Test({
  ...nodeCommon,
  args: ["scripts/publish-feeds.mjs", "--dry-run"],
  data: [wikiSources, mythicalSources]
})

const mythicalCheck = S.Shell.Test({
  ...nodeCommon,
  args: [
    "-e",
    "const fs=require('node:fs');const d=JSON.parse(fs.readFileSync('.smithers/mythical/epics.json','utf8'));if(d.schemaVersion!==1||!Array.isArray(d.epics)||d.epics.length<5)process.exit(1);const ids=new Set(d.epics.map(e=>e.id));for(const e of d.epics){for(const dep of e.dependsOn||[]){if(!ids.has(dep)){console.error('unknown dep',dep);process.exit(1);}}for(const p of e.paths||[]){if(!fs.existsSync(p)){console.error('missing path',p);process.exit(1);}}}console.log('mythical history valid:',d.epics.length,'epics');"
  ],
  data: [mythicalSources]
})

const auditReport = S.Shell.Build({
  ...nodeCommon,
  args: ["scripts/audit-report.mjs", "--strict"],
  outFiles: ["//.smithers/reports/audit-report.html", "//.smithers/reports/audit-report.json"],
  data: [uphillSources, factorySources, wikiSources, mythicalSources, authSources, zig, ts]
})

const factoryTest = S.Shell.Test({
  ...nodeCommon,
  args: ["--test", ".smithers/tests/factory.test.mjs"],
  data: [factorySources, wikiSources, mythicalSources, uphillSources, authSources, S.file("//scripts/project-home.mjs")]
})

export const Package = S.Package({
  targets: {
    "install-sources": install,
    "zig-sources": zig,
    "ts-sources": ts,
    "ts-types": tsTypes,
    "factory-sources": factorySources,
    "factory-write": factoryWrite,
    "factory-check": S.FactoryProjection({ mode: "check", homeOutput: ".smithers/.home-projection.unused" }),
    "home-write": homeWrite,
    "home-check": homeCheck,
    "wiki-check": wikiCheck,
    "mythical-check": mythicalCheck,
    "audit-report": auditReport,
    "factory-test": factoryTest,
    "zig-fmt": zigFmt,
    "zig-build": zigBuild,
    "zig-test": zigTest,
    "c-api-build": cApiBuild,
    "c-api-smoke": cApiSmoke,
    "wasm-build": wasmBuild,
    "ts-typecheck": tsTypecheck,
    "ts-lint": tsLint,
    "ts-test": tsTest,
    "ts-test-wasm": tsTestWasm,
    "ts-build": tsBuild,
    "docs-check": docsCheck,
    "playground-build": playgroundBuild,
    "verify-packaging": verifyPackaging
  }
})
