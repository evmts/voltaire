import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

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
    if (["node_modules", "dist", "target", ".git", ".jj", "coverage", ".zig-cache", "zig-out", "zig-pkg", "lib"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

function stripLineComments(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      let inStr = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]!;
        if (ch === '"' && line[i - 1] !== "\\") inStr = !inStr;
        if (!inStr && ch === "/" && line[i + 1] === "/") return line.slice(0, i);
      }
      return line;
    })
    .join("\n");
}

function findFirstLine(content: string, regex: RegExp): { line: number; match: string } | null {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(regex);
    if (m) return { line: i + 1, match: m[0] };
  }
  return null;
}

function checkLongZigFunctions(prodCode: string): { name: string; line: number; length: number } | null {
  // Custom brace-depth measurement for Zig functions (TigerStyle 70-line limit).
  const fnRe = /(?:^|\n)[ \t]*(?:pub\s+)?(?:inline\s+|export\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/g;
  let worst: { name: string; line: number; length: number } | null = null;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(prodCode)) !== null) {
    const startIdx = m.index;
    const startLine = prodCode.slice(0, startIdx).split("\n").length;
    const braceIdx = prodCode.indexOf("{", startIdx);
    const semiIdx = prodCode.indexOf(";", startIdx);
    if (braceIdx === -1 || (semiIdx !== -1 && semiIdx < braceIdx)) continue;
    let depth = 0;
    let i = braceIdx;
    let inStr = false;
    for (; i < prodCode.length; i++) {
      const ch = prodCode[i]!;
      const prev = i > 0 ? prodCode[i - 1] : "";
      if (inStr) {
        if (ch === '"' && prev !== "\\") inStr = false;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const len = prodCode.slice(startIdx, i + 1).split("\n").length;
    if (len > 70 && (!worst || len > worst.length)) {
      worst = { name: m[1]!, line: startLine, length: len };
    }
  }
  return worst;
}

// Group Zig files by module unit (top-level subdir under primitives/ or crypto/, or top-level domain)
const zigSrc = join(root, "packages/voltaire-zig/src");
const zigFiles = walk(zigSrc).filter((f) => f.endsWith(".zig") && !f.includes("test") && !f.includes("bench"));
const zigGroups = new Map<string, string[]>();
for (const file of zigFiles) {
  const rel = relative(zigSrc, file);
  const parts = rel.split("/");
  const group =
    parts.length >= 3 && (parts[0] === "primitives" || parts[0] === "crypto")
      ? `${parts[0]}/${parts[1]}`
      : parts.length >= 2
        ? parts[0]!
        : "root";
  const list = zigGroups.get(group) ?? [];
  list.push(file);
  zigGroups.set(group, list);
}

for (const [group, files] of [...zigGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  let panicNote: string | null = null;
  let importNote: string | null = null;
  let fnNote: string | null = null;

  for (const file of files) {
    const rel = relative(root, file);
    const raw = readFileSync(file, "utf8");
    // Strip trailing inline `test "..." { ... }` blocks from production code checks
    const prodRaw = raw.split(/\n(?:pub\s+)?test\s+["{]/)[0] ?? raw;
    const prod = stripLineComments(prodRaw);

    if (!panicNote) {
      const hit = findFirstLine(prod, /@panic\s*\(|\bcatch\s+unreachable\b/);
      if (hit) panicNote = `${rel}:${hit.line}: ${hit.match}`;
    }
    if (!importNote) {
      const hit = findFirstLine(
        prod,
        /@import\(\s*"\.\.\/(?:primitives|crypto|precompiles|evm|state-manager|blockchain|jsonrpc)\//,
      );
      if (hit) importNote = `${rel}:${hit.line}: cross-module relative ${hit.match}`;
    }
    if (!fnNote) {
      const longFn = checkLongZigFunctions(prod);
      if (longFn) fnNote = `${rel}:${longFn.line}: fn ${longFn.name} is ${longFn.length} lines (> 70)`;
    }
  }

  outLines.push(
    panicNote
      ? `zig-no-panic ${quote(group)} fail note ${quote(panicNote)}`
      : `zig-no-panic ${quote(group)} pass`,
  );
  outLines.push(
    importNote
      ? `zig-module-imports ${quote(group)} fail note ${quote(importNote)}`
      : `zig-module-imports ${quote(group)} pass`,
  );
  outLines.push(
    fnNote
      ? `zig-function-length ${quote(group)} fail note ${quote(fnNote)}`
      : `zig-function-length ${quote(group)} pass`,
  );
}

// Internal Rust crypto wrappers in voltaire-zig
const rsFiles = [
  ...walk(join(root, "packages/voltaire-zig/src")).filter((f) => f.endsWith(".rs")),
].sort();

for (const file of rsFiles) {
  const rel = relative(root, file);
  const raw = readFileSync(file, "utf8");
  const prodRaw = raw.split(/#\[cfg\(test\)\]/)[0] ?? raw;
  const prod = stripLineComments(prodRaw);

  const unwrapHit = findFirstLine(prod, /\.unwrap\(\)|\bpanic!\s*\(/);
  if (unwrapHit) {
    outLines.push(`rust-no-unwrap-panic ${quote(rel)} fail note ${quote(`line ${unwrapHit.line}: ${unwrapHit.match}`)}`);
  } else {
    outLines.push(`rust-no-unwrap-panic ${quote(rel)} pass`);
  }

  const unsafeCount = (prod.match(/\bunsafe\s*(?:\{|(?:extern\s+(?:"[^"]*"\s+)?)?fn\b)/g) ?? []).length;
  outLines.push(`rust-unsafe-blocks ${quote(rel)} ${unsafeCount}`);
}

appendFileSync(out, `${outLines.join("\n")}\n`);
