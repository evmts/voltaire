import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

function emit(metric: string, item: string, ok: boolean, note?: string): void {
  if (ok) lines.push(`${metric} ${quote(item)} pass`);
  else lines.push(`${metric} ${quote(item)} fail note ${quote(note ?? "failed")}`);
}

// 1. Factory projection validity & switchover invariants
{
  const factoryPath = join(root, ".smithers/factory.json");
  const homePath = join(root, ".smithers/home.json");
  const workspacePath = join(root, ".smithers/WORKSPACE.ts");
  const conflictPath = join(root, ".smithers/WORKSPACE.smithers");

  emit("factory-projection", "workspace-single-root", existsSync(workspacePath) && !existsSync(conflictPath),
    existsSync(conflictPath) ? "duplicate .smithers/WORKSPACE.smithers breaks smthrs discovery" : "missing .smithers/WORKSPACE.ts");

  if (!existsSync(factoryPath)) {
    emit("factory-projection", "factory.json", false, "missing .smithers/factory.json");
  } else {
    try {
      const f = JSON.parse(readFileSync(factoryPath, "utf8")) as Record<string, unknown>;
      const gh = (f.github ?? {}) as Record<string, unknown>;
      const triggers = ((f.contributes as Record<string, unknown> | undefined)?.triggers ?? []) as unknown[];
      const problems: string[] = [];
      if (f.apiVersion !== 1) problems.push("missing apiVersion: 1");
      if (!Array.isArray(triggers) || triggers.length === 0) problems.push("missing contributes.triggers");
      if (gh.mirror !== "push" || gh.changes !== "land") problems.push(`github policy is ${String(gh.mirror)}/${String(gh.changes)} instead of push/land`);
      if (!Array.isArray(gh.protectedPaths) || gh.protectedPaths.length < 5) problems.push("protectedPaths incomplete");
      emit("factory-projection", "factory.json", problems.length === 0, problems.join(", "));
    } catch (err) {
      emit("factory-projection", "factory.json", false, err instanceof Error ? err.message : String(err));
    }
  }

  if (!existsSync(homePath)) {
    emit("factory-projection", "home.json", false, "missing .smithers/home.json");
  } else {
    try {
      const h = JSON.parse(readFileSync(homePath, "utf8")) as {
        docs?: string;
        sections?: Array<{ audience?: string; blocks?: Array<{ type?: string }> }>;
      };
      const audiences = new Set((h.sections ?? []).map((s) => s.audience ?? "everyone"));
      const blockTypes = (h.sections ?? []).flatMap((s) => (s.blocks ?? []).map((b) => b.type ?? ""));
      const problems: string[] = [];
      if (!h.docs?.startsWith("https://")) problems.push("missing https docs llms.txt url");
      for (const req of ["maintainer", "contributor", "everyone"]) {
        if (!audiences.has(req)) problems.push(`missing ${req} audience section`);
      }
      if (blockTypes.includes("markdown")) problems.push("markdown block delays pre-clone first paint on smithers.sh");
      emit("factory-projection", "home.json", problems.length === 0, problems.join(", "));
    } catch (err) {
      emit("factory-projection", "home.json", false, err instanceof Error ? err.message : String(err));
    }
  }
}

// 2. Trust boundaries: shared remote cache read/write split, untrusted write guard, zero leaked secrets
{
  const wsPath = join(root, ".smithers/WORKSPACE.ts");
  const wrapperPath = join(root, "scripts/smthrs");
  const mcpPath = join(root, ".mcp.json");

  const wsText = existsSync(wsPath) ? readFileSync(wsPath, "utf8") : "";
  emit(
    "trust-boundaries",
    "remote-cache-split-tokens",
    wsText.includes("https://build.smithers.sh") &&
      wsText.includes("SMITHERS_CACHE_READ_TOKEN") &&
      wsText.includes("SMITHERS_CACHE_WRITE_TOKEN"),
    "WORKSPACE.ts must configure https://build.smithers.sh with split read/write secrets",
  );

  const wrapperText = existsSync(wrapperPath) ? readFileSync(wrapperPath, "utf8") : "";
  emit(
    "trust-boundaries",
    "untrusted-cache-write-guard",
    wrapperText.includes("unset SMITHERS_CACHE_WRITE_TOKEN"),
    "scripts/smthrs must strip SMITHERS_CACHE_WRITE_TOKEN for untrusted/fork runs",
  );

  const secretLeakRe = /(?:sma_[0-9a-f]{40,}|smm_[0-9a-f]{40,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|npm_[A-Za-z0-9]{20,})/;
  let leakedFile: string | null = null;
  const checkFiles = [
    ".smithers/WORKSPACE.ts",
    ".smithers/FACTORY.ts",
    ".smithers/PACKAGE.ts",
    ".smithers/factory.json",
    ".smithers/home.json",
    ".mcp.json",
    "scripts/smthrs",
    "scripts/smthrs-auth.mjs",
  ];
  for (const rel of checkFiles) {
    const full = join(root, rel);
    if (!existsSync(full)) continue;
    if (secretLeakRe.test(readFileSync(full, "utf8"))) {
      leakedFile = rel;
      break;
    }
  }
  emit("trust-boundaries", "no-committed-secrets", leakedFile === null, leakedFile ? `credential pattern found in ${leakedFile}` : undefined);

  const mcpOk =
    existsSync(mcpPath) &&
    readFileSync(mcpPath, "utf8").includes("https://smithers.sh/evmts/voltaire/mcp");
  emit("trust-boundaries", "cloud-mcp-config", mcpOk, "missing .mcp.json pointing at https://smithers.sh/evmts/voltaire/mcp");
}

// 3. Obsidian-compatible Wiki & Coding Project catalog integrity
{
  const catalogPath = join(root, ".smithers/coding-project.json");
  const wikiDir = join(root, ".smithers/wiki/pages");
  if (!existsSync(catalogPath) || !existsSync(wikiDir)) {
    emit("wiki-integrity", "catalog-and-pages", false, "missing .smithers/coding-project.json or .smithers/wiki/pages");
  } else {
    try {
      const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
        pages?: Array<{ id: string; document: string; inputs: string[]; related?: string[] }>;
      };
      const pages = catalog.pages ?? [];
      const pageIds = new Set(pages.map((p) => p.id));
      const mdFiles = new Set(readdirSync(wikiDir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")));
      const problems: string[] = [];

      if (pages.length < 8) problems.push(`only ${pages.length} wiki pages (expected >= 8)`);
      for (const page of pages) {
        const docFull = join(root, page.document);
        if (!existsSync(docFull)) {
          problems.push(`missing doc ${page.document}`);
          continue;
        }
        const raw = readFileSync(docFull, "utf8");
        if (!raw.startsWith("---\n") || !raw.includes("\ntitle:") || !raw.includes("\ntags:")) {
          problems.push(`${page.id} missing YAML frontmatter title/tags`);
        }
        for (const input of page.inputs ?? []) {
          if (!existsSync(join(root, input))) {
            problems.push(`${page.id} missing input ${input}`);
          }
        }
        for (const rel of page.related ?? []) {
          if (!pageIds.has(rel)) problems.push(`${page.id} unknown related page ${rel}`);
        }
        // Check [[wikilinks]] outside fenced code blocks
        let fenced = false;
        for (const line of raw.split("\n")) {
          if (/^\s*```/.test(line)) {
            fenced = !fenced;
            continue;
          }
          if (fenced) continue;
          for (const m of line.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
            const target = m[1]!.trim();
            if (!mdFiles.has(target)) problems.push(`${page.id} broken wikilink [[${target}]]`);
          }
        }
      }
      emit("wiki-integrity", "catalog-and-pages", problems.length === 0, problems.slice(0, 3).join("; "));
    } catch (err) {
      emit("wiki-integrity", "catalog-and-pages", false, err instanceof Error ? err.message : String(err));
    }
  }
}

// 4. Mythical History ledger integrity
{
  const epicsPath = join(root, ".smithers/mythical/epics.json");
  if (!existsSync(epicsPath)) {
    emit("mythical-integrity", "epics-ledger", false, "missing .smithers/mythical/epics.json");
  } else {
    try {
      const data = JSON.parse(readFileSync(epicsPath, "utf8")) as {
        schemaVersion?: number;
        epics?: Array<{ id: string; title: string; dependsOn?: string[]; paths?: string[] }>;
      };
      const epics = data.epics ?? [];
      const ids = new Set(epics.map((e) => e.id));
      const problems: string[] = [];
      if (data.schemaVersion !== 1) problems.push("expected schemaVersion 1");
      if (epics.length < 5) problems.push(`only ${epics.length} epics`);
      for (const epic of epics) {
        for (const dep of epic.dependsOn ?? []) {
          if (!ids.has(dep)) problems.push(`${epic.id} unknown dep ${dep}`);
        }
        for (const p of epic.paths ?? []) {
          if (!existsSync(join(root, p))) problems.push(`${epic.id} missing path ${p}`);
        }
      }
      emit("mythical-integrity", "epics-ledger", problems.length === 0, problems.slice(0, 3).join("; "));
    } catch (err) {
      emit("mythical-integrity", "epics-ledger", false, err instanceof Error ? err.message : String(err));
    }
  }
}

// 5. Mintlify docs.json + llms.txt + C ABI header hygiene
{
  const tsDocs = join(root, "packages/voltaire-ts/docs");
  const docsJsonPath = join(tsDocs, "docs.json");
  const llmsPath = join(tsDocs, "llms.txt");
  const problems: string[] = [];
  if (!existsSync(docsJsonPath)) problems.push("missing docs.json");
  if (!existsSync(llmsPath)) problems.push("missing llms.txt");
  if (problems.length === 0) {
    try {
      JSON.parse(readFileSync(docsJsonPath, "utf8"));
      const llmsText = readFileSync(llmsPath, "utf8");
      if (!llmsText.includes("/model-context-protocol") && !llmsText.includes("Getting Started")) {
        problems.push("llms.txt missing core index entries");
      }
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
    }
  }
  emit("docs-llms-freshness", "voltaire-ts-docs", problems.length === 0, problems.join("; "));

  const headerPath = join(root, "packages/voltaire-zig/src/primitives.h");
  const headerOk =
    existsSync(headerPath) &&
    readFileSync(headerPath, "utf8").includes("#ifndef") &&
    readFileSync(headerPath, "utf8").includes("primitives_");
  emit("c-abi-header", "primitives.h", headerOk, "missing or invalid packages/voltaire-zig/src/primitives.h");
}

appendFileSync(out, `${lines.join("\n")}\n`);
