import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const out = process.env.UPHILL_METRICS;
if (!out) {
  console.error("UPHILL_METRICS is not set");
  process.exit(1);
}

const root = process.cwd();
const outLines: string[] = [];

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "target", ".git", ".jj", "coverage", ".zig-cache", "zig-out", "zig-pkg", "lib", "docs"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

// 1. Test-to-source ratio per core TypeScript/Effect subsystem
const tsAreas = [
  "primitives",
  "crypto",
  "evm",
  "jsonrpc",
  "provider",
  "state-manager",
  "blockchain",
  "contract",
  "wallet",
];
for (const area of tsAreas) {
  const dir = join(root, "packages/voltaire-ts/src", area);
  if (!existsSync(dir)) continue;
  const files = walk(dir).filter((f) => /\.(ts|js|mjs)$/.test(f) && !f.endsWith(".d.ts") && !/\.bench\./.test(f));
  const prod = files.filter((f) => !/\.(test|spec)\./.test(f));
  const tests = files.filter((f) => /\.(test|spec)\./.test(f));
  const prodLines = prod.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const testLines = tests.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const ratio = prodLines > 0 ? Math.round((testLines / prodLines) * 100) : 100;
  outLines.push(`test-ratio ${quote(`voltaire-ts/${area}`)} ${ratio}`);
}

// voltaire-effect overall ratio
{
  const files = walk(join(root, "packages/voltaire-effect/src")).filter(
    (f) => /\.(vibe|ts|js)$/.test(f) && !f.endsWith(".d.ts"),
  );
  const prod = files.filter((f) => !/\.(test|spec)\./.test(f));
  const tests = files.filter((f) => /\.(test|spec)\./.test(f));
  const prodLines = prod.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const testLines = tests.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const ratio = prodLines > 0 ? Math.round((testLines / prodLines) * 100) : 100;
  outLines.push(`test-ratio "voltaire-effect" ${ratio}`);
}

// voltaire-zig inline + dedicated test line ratio
{
  const files = walk(join(root, "packages/voltaire-zig/src")).filter((f) => f.endsWith(".zig") && !f.includes("bench"));
  let prodLines = 0;
  let testLines = 0;
  for (const f of files) {
    const txt = readFileSync(f, "utf8");
    if (f.includes("test")) {
      testLines += txt.split("\n").length;
    } else {
      const idx = txt.search(/\n(?:pub\s+)?test\s+["{]/);
      if (idx === -1) {
        prodLines += txt.split("\n").length;
      } else {
        prodLines += txt.slice(0, idx).split("\n").length;
        testLines += txt.slice(idx).split("\n").length;
      }
    }
  }
  const ratio = prodLines > 0 ? Math.round((testLines / prodLines) * 100) : 100;
  outLines.push(`test-ratio "voltaire-zig" ${ratio}`);
}

// voltaire-rs test line ratio (inline #[cfg(test)] + tests/)
{
  const srcFiles = walk(join(root, "packages/voltaire-rs/src")).filter((f) => f.endsWith(".rs"));
  const extTests = walk(join(root, "packages/voltaire-rs/tests")).filter((f) => f.endsWith(".rs"));
  let prodLines = 0;
  let testLines = extTests.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  for (const f of srcFiles) {
    const txt = readFileSync(f, "utf8");
    const idx = txt.search(/#\[cfg\(test\)\]/);
    if (idx === -1) {
      prodLines += txt.split("\n").length;
    } else {
      prodLines += txt.slice(0, idx).split("\n").length;
      testLines += txt.slice(idx).split("\n").length;
    }
  }
  const ratio = prodLines > 0 ? Math.round((testLines / prodLines) * 100) : 100;
  outLines.push(`test-ratio "voltaire-rs" ${ratio}`);
}

// 2. Zig/TS module directory parity (CLAUDE.md Architecture)
const zigCoreDirs = readdirSync(join(root, "packages/voltaire-zig/src"), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
for (const dir of zigCoreDirs) {
  const tsMirror = join(root, "packages/voltaire-ts/src", dir);
  if (existsSync(tsMirror)) {
    outLines.push(`zig-ts-parity ${quote(dir)} pass`);
  } else {
    outLines.push(`zig-ts-parity ${quote(dir)} fail note ${quote(`missing packages/voltaire-ts/src/${dir}`)}`);
  }
}

// 3. Top-level Markdown link hygiene
for (const docFile of ["README.md", "CLAUDE.md", "CONTRIBUTING.md"]) {
  const full = join(root, docFile);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  let broken: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(content)) !== null) {
    const href = m[1]!.split("#")[0]!.trim();
    if (!href || /^(?:https?:|mailto:|#)/.test(href)) continue;
    const resolved = resolve(dirname(full), href);
    if (!existsSync(resolved)) {
      broken = `broken link ${href}`;
      break;
    }
  }
  if (broken) {
    outLines.push(`docs-links ${quote(docFile)} fail note ${quote(broken)}`);
  } else {
    outLines.push(`docs-links ${quote(docFile)} pass`);
  }
}

appendFileSync(out, `${outLines.join("\n")}\n`);
