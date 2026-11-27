#!/usr/bin/env node
/**
 * Projects `.smithers/HOME.ts` into `.smithers/home.json` and validates the
 * rendered document against `@smthrs/views`'s `Home.read()` schema.
 *
 * Usage:
 *   node scripts/project-home.mjs --write   # write .smithers/home.json
 *   node scripts/project-home.mjs --check   # fail on drift or schema violation
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;

const homeModUrl = pathToFileURL(join(root, ".smithers/HOME.ts")).href;
const { home } = await import(homeModUrl);

const viewsUrl = pathToFileURL(join(root, ".smithers/node_modules/@smthrs/views/dist/esm/Home.js")).href;
const Home = await import(viewsUrl);

const rendered = `${JSON.stringify(home, null, 2)}\n`;
const parsed = Home.read(rendered);
if (parsed._tag !== "Declared") {
  process.stderr.write(`HOME.ts invalid according to @smthrs/views Home.read: ${JSON.stringify(parsed)}\n`);
  process.exit(1);
}
if (parsed.skipped > 0) {
  process.stderr.write(`HOME.ts contains ${parsed.skipped} unknown/skipped block(s); fix block declarations.\n`);
  process.exit(1);
}

// Enforce public copy hygiene on non-code prose: no em dashes or semicolons in user-facing text.
for (const section of home.sections ?? []) {
  for (const block of section.blocks ?? []) {
    if (block.type === "code") continue;
    const textValues = [];
    const visit = (v) => {
      if (typeof v === "string") textValues.push(v);
      else if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object") {
        for (const [k, val] of Object.entries(v)) {
          if (k === "url" || k === "install" || k === "flow" || k === "key" || k === "type") continue;
          visit(val);
        }
      }
    };
    visit(block);
    for (const str of textValues) {
      if (str.includes("\u2014")) {
        process.stderr.write(`HOME.ts copy error: em dash found in ${JSON.stringify(str)}\n`);
        process.exit(1);
      }
      if (str.includes(";")) {
        process.stderr.write(`HOME.ts copy error: semicolon found in ${JSON.stringify(str)}\n`);
        process.exit(1);
      }
    }
  }
}

const outPath = join(root, ".smithers/home.json");
if (writeMode) {
  writeFileSync(outPath, rendered, "utf8");
  process.stdout.write(`Wrote .smithers/home.json (${parsed.sections.length} sections, ${parsed.sections.reduce((n, s) => n + s.blocks.length, 0)} blocks)\n`);
  process.exit(0);
}

if (checkMode) {
  const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  if (existing !== rendered) {
    process.stderr.write(".smithers/home.json is out of sync with .smithers/HOME.ts. Run: scripts/smthrs target //.smithers:home-write --write\n");
    process.exit(1);
  }
  process.stdout.write(`.smithers/home.json matches .smithers/HOME.ts (${parsed.sections.length} sections, 0 skipped blocks)\n`);
}
