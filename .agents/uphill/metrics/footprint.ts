import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const out = process.env.UPHILL_METRICS;
if (!out) {
  console.error("UPHILL_METRICS is not set");
  process.exit(1);
}

const root = process.cwd();
const lines: string[] = [];

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "target", ".git", ".jj", "coverage", ".zig-cache", "zig-out", "zig-pkg"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

// 1. Tracked WASM bundle footprint (raw and gzipped)
const wasmPath = join(root, "packages/voltaire-ts/src/wasm-loader/primitives.wasm");
if (existsSync(wasmPath)) {
  const buf = readFileSync(wasmPath);
  const gz = gzipSync(buf, { level: 9 }).length;
  lines.push(`wasm-bundle-size "primitives.wasm:raw" ${buf.length}B`);
  lines.push(`wasm-bundle-size "primitives.wasm:gzip" ${gz}B`);
}

// 2. Flagship primitive & crypto surfaces (aligned with .size-limit.json)
const surfaces = [
  "primitives/Address",
  "primitives/Hex",
  "primitives/Uint",
  "primitives/Hash",
  "primitives/Transaction",
  "primitives/Rlp",
  "primitives/Abi",
  "crypto/Keccak256",
  "crypto/Secp256k1",
  "crypto/Bls12381",
  "crypto/bn254",
  "crypto/KZG",
  "crypto/EIP712",
];

for (const surface of surfaces) {
  const dir = join(root, "packages/voltaire-ts/src", surface);
  if (!existsSync(dir)) continue;
  const srcFiles = walk(dir).filter(
    (f) => /\.(ts|js|mjs)$/.test(f) && !/\.(test|spec|bench)\./.test(f) && !f.endsWith(".d.ts"),
  );
  if (srcFiles.length === 0) continue;
  const combined = Buffer.concat(srcFiles.map((f) => readFileSync(f)));
  const gz = gzipSync(combined, { level: 9 }).length;
  lines.push(`primitive-source-bytes ${quote(surface)} ${gz}B`);
}

// 3. Direct runtime dependency counts
for (const pkgPath of ["packages/voltaire-ts/package.json"]) {
  const full = join(root, pkgPath);
  if (!existsSync(full)) continue;
  const pkg = JSON.parse(readFileSync(full, "utf8")) as {
    name?: string;
    dependencies?: Record<string, string>;
  };
  lines.push(`package-deps ${quote(pkg.name ?? pkgPath)} ${Object.keys(pkg.dependencies ?? {}).length}`);
}

const cargoPath = join(root, "Cargo.toml");
if (existsSync(cargoPath)) {
  const cargo = readFileSync(cargoPath, "utf8");
  const depSection = cargo.match(/\[dependencies\]([\s\S]*?)(?:\n\[|$)/)?.[1] ?? "";
  const depCount = depSection
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && /^[A-Za-z0-9_-]+\s*=/.test(l)).length;
  lines.push(`package-deps "Cargo.toml" ${depCount}`);
}

appendFileSync(out, `${lines.join("\n")}\n`);
