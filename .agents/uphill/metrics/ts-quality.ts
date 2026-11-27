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
    if (["node_modules", "dist", "types", ".git", ".jj", "coverage", "docs"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

function stripComments(source: string): string {
  let result = "";
  let i = 0;
  let inStr: string | null = null;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (inStr) {
      result += ch;
      if (ch === "\\" && next !== undefined) {
        result += next;
        i += 2;
        continue;
      }
      if (ch === inStr) inStr = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") {
        result += " ";
        i++;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      result += "  ";
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        result += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < source.length) {
        result += "  ";
        i += 2;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
    result += ch;
    i++;
  }
  return result;
}

function findFirstLine(content: string, regex: RegExp): { line: number; match: string } | null {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(regex);
    if (m) return { line: i + 1, match: m[0] };
  }
  return null;
}

function checkLongFunctions(code: string): { name: string; line: number; length: number } | null {
  const fnRe = /(?:export\s+)?(?:async\s+)?(?:effect\s+)?function\s+([A-Za-z0-9_]+)/g;
  let worst: { name: string; line: number; length: number } | null = null;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(code)) !== null) {
    const startIdx = m.index;
    const startLine = code.slice(0, startIdx).split("\n").length;
    const braceIdx = code.indexOf("{", startIdx);
    if (braceIdx === -1) continue;
    let depth = 0;
    let i = braceIdx;
    let inStr: string | null = null;
    for (; i < code.length; i++) {
      const ch = code[i]!;
      const prev = i > 0 ? code[i - 1] : "";
      if (inStr) {
        if (ch === inStr && prev !== "\\") inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const len = code.slice(startIdx, i + 1).split("\n").length;
    if (len > 70 && (!worst || len > worst.length)) {
      worst = { name: m[1]!, line: startLine, length: len };
    }
  }
  return worst;
}

// Group files into user-facing domain surfaces across voltaire-ts and voltaire-effect
const groups = new Map<string, string[]>();

for (const [pkgLabel, baseDir] of [
  ["voltaire-ts", join(root, "packages/voltaire-ts/src")],
  ["voltaire-effect", join(root, "packages/voltaire-effect/src")],
] as const) {
  const files = walk(baseDir).filter(
    (f) =>
      /\.(ts|js|mjs|vibe)$/.test(f) &&
      !/\.(test|test-d|spec|bench)\./.test(f) &&
      !f.endsWith(".d.ts") &&
      !f.includes("/examples/"),
  );
  for (const file of files) {
    const rel = relative(baseDir, file);
    const parts = rel.split("/");
    const surface =
      pkgLabel === "voltaire-ts" && parts.length >= 3 && (parts[0] === "primitives" || parts[0] === "crypto")
        ? `${pkgLabel}/${parts[0]}/${parts[1]}`
        : parts.length >= 2
          ? `${pkgLabel}/${parts[0]}`
          : `${pkgLabel}/root`;
    const list = groups.get(surface) ?? [];
    list.push(file);
    groups.set(surface, list);
  }
}

for (const [surface, files] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  let consoleNote: string | null = null;
  let anyNote: string | null = null;
  let suppressNote: string | null = null;
  let fnNote: string | null = null;

  for (const file of files) {
    const rel = relative(root, file);
    const raw = readFileSync(file, "utf8");
    const code = stripComments(raw);

    if (!consoleNote) {
      const hit = findFirstLine(code, /\bconsole\.(?:log|warn|error|debug|info)\s*\(/);
      if (hit) consoleNote = `${rel}:${hit.line}: ${hit.match}`;
    }
    if (!anyNote) {
      const hit = findFirstLine(code, /\bas\s+any\b|:\s*any\b/);
      if (hit) anyNote = `${rel}:${hit.line}: ${hit.match}`;
    }
    if (!suppressNote) {
      const hit = findFirstLine(raw, /@ts-(?:ignore|expect-error|nocheck)\b/);
      if (hit) suppressNote = `${rel}:${hit.line}: ${hit.match}`;
    }
    if (!fnNote) {
      const longFn = checkLongFunctions(code);
      if (longFn) fnNote = `${rel}:${longFn.line}: function ${longFn.name} is ${longFn.length} lines (> 70)`;
    }
  }

  outLines.push(
    consoleNote
      ? `console-policy ${quote(surface)} fail note ${quote(consoleNote)}`
      : `console-policy ${quote(surface)} pass`,
  );
  outLines.push(
    anyNote
      ? `explicit-any ${quote(surface)} fail note ${quote(anyNote)}`
      : `explicit-any ${quote(surface)} pass`,
  );
  outLines.push(
    suppressNote
      ? `ts-suppressions ${quote(surface)} fail note ${quote(suppressNote)}`
      : `ts-suppressions ${quote(surface)} pass`,
  );
  outLines.push(
    fnNote
      ? `function-length ${quote(surface)} fail note ${quote(fnNote)}`
      : `function-length ${quote(surface)} pass`,
  );
}

appendFileSync(out, `${outLines.join("\n")}\n`);
