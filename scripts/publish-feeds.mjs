#!/usr/bin/env node
/**
 * Publishes Voltaire's Obsidian wiki, Mythical History, and Lighthouse Backpressure
 * Audit Report to Smithers Cloud repository feeds (`POST /api/repos/evmts/voltaire/feeds`).
 *
 * Compatible with Smithers Cloud's built-in `plugins/wiki` (`{ notes: [...] }`)
 * and `plugins/factory` feed documents.
 *
 * Usage:
 *   node scripts/publish-feeds.mjs --dry-run          # build & verify feed payload locally
 *   SMITHERS_FEED_KEY=... node scripts/publish-feeds.mjs  # publish to smithers.sh
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const apiBase = (process.env.SMITHERS_API_URL ?? "https://smithers.sh").replace(/\/$/, "");
const repo = process.env.SMITHERS_REPO ?? "evmts/voltaire";
const feedKey = process.env.SMITHERS_FEED_KEY ?? "";

const catalogPath = join(root, ".smithers/coding-project.json");
const epicsPath = join(root, ".smithers/mythical/epics.json");
const auditJsonPath = join(root, ".smithers/reports/audit-report.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const epics = JSON.parse(readFileSync(epicsPath, "utf8"));

const notes = (catalog.pages ?? []).map((page) => {
  const full = join(root, page.document);
  const markdown = readFileSync(full, "utf8");
  return {
    path: `wiki/${page.id}.md`,
    title: page.title,
    markdown,
  };
});

const auditSummary = existsSync(auditJsonPath)
  ? JSON.parse(readFileSync(auditJsonPath, "utf8"))
  : null;

const payload = {
  set: {
    wiki: {
      visibility: "public",
      body: {
        repository: repo,
        reviewer: catalog.reviewer,
        generatedAt: new Date().toISOString(),
        notes,
      },
    },
    mythical: {
      visibility: "public",
      body: epics,
    },
    ...(auditSummary
      ? {
          audit_report: {
            visibility: "public",
            body: auditSummary,
          },
        }
      : {}),
  },
};

const outDir = resolve(root, ".smithers/reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "feeds-payload.json");
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const docNames = Object.keys(payload.set);
const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
process.stdout.write(
  `Prepared Smithers Cloud feed payload for ${repo}: docs=[${docNames.join(", ")}] notes=${notes.length} size=${bytes}B\n`,
);

if (dryRun || !feedKey) {
  if (!dryRun && !feedKey) {
    process.stdout.write("SMITHERS_FEED_KEY not set; skipping network publish (wrote .smithers/reports/feeds-payload.json).\n");
  }
  process.exit(0);
}

const url = `${apiBase}/api/repos/${repo}/feeds`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    authorization: `Bearer ${feedKey}`,
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});
const text = await res.text();
if (!res.ok) {
  process.stderr.write(`Feed publish failed (${res.status}): ${text.slice(0, 300)}\n`);
  process.exit(1);
}
process.stdout.write(`Published to ${url}: ${text}\n`);
