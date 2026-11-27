import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const Home = await import(pathToFileURL(join(root, ".smithers/node_modules/@smthrs/views/dist/esm/Home.js")).href);

describe("Voltaire Smithers Cloud workspace & cache trust boundaries", () => {
  it("keeps a single WORKSPACE.ts root without legacy 0.x clutter", () => {
    assert.equal(existsSync(join(root, ".smithers/WORKSPACE.ts")), true);
    assert.equal(existsSync(join(root, ".smithers/WORKSPACE.smithers")), false);
    assert.equal(existsSync(join(root, ".smithers/main.tsx")), false);
    assert.equal(existsSync(join(root, ".smithers/package.json")), true);
    assert.equal(existsSync(join(root, "scripts/smthrs")), true);
  });

  it("configures shared remote cache https://build.smithers.sh with split read/write secrets", () => {
    const ws = readFileSync(join(root, ".smithers/WORKSPACE.ts"), "utf8");
    assert.match(ws, /https:\/\/build\.smithers\.sh/);
    assert.match(ws, /SMITHERS_CACHE_READ_TOKEN/);
    assert.match(ws, /SMITHERS_CACHE_WRITE_TOKEN/);
  });

  it("blocks cache writes on untrusted/fork runs even if a write token is in env", () => {
    const res = spawnSync("node", ["scripts/smthrs-auth.mjs", "verify-trust", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_HEAD_REPO_FORK: "true",
        SMITHERS_CACHE_READ_TOKEN: "read_dummy",
        SMITHERS_CACHE_WRITE_TOKEN: "write_dummy",
      },
    });
    assert.equal(res.status, 0, res.stderr);
    const trust = JSON.parse(res.stdout);
    assert.equal(trust.mode, "untrusted");
    assert.equal(trust.cacheAccess, "read-only");
    assert.equal(trust.cacheWriteBlocked, true);
    assert.equal(trust.canSkipGates, false);
  });

  it("allows read-write cache only in trusted controlled runs", () => {
    const res = spawnSync("node", ["scripts/smthrs-auth.mjs", "verify-trust", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_HEAD_REPO_FORK: "false",
        SMITHERS_UNTRUSTED: "0",
        SMITHERS_TRUSTED: "1",
        SMITHERS_CACHE_READ_TOKEN: "read_dummy",
        SMITHERS_CACHE_WRITE_TOKEN: "write_dummy",
      },
    });
    assert.equal(res.status, 0, res.stderr);
    const trust = JSON.parse(res.stdout);
    assert.equal(trust.mode, "trusted");
    assert.equal(trust.cacheAccess, "read-write");
    assert.equal(trust.cacheWriteBlocked, false);
    assert.equal(trust.canSkipGates, false);
  });
});

describe("One-time / short-lived sandbox token minting & Cloud MCP", () => {
  it("declares Cloud MCP endpoint https://smithers.sh/evmts/voltaire/mcp in .mcp.json", () => {
    const mcp = JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"));
    assert.equal(mcp.mcpServers["smithers-voltaire"].url, "https://smithers.sh/evmts/voltaire/mcp");
  });

  it("mints scoped short-lived tokens to mode-0600 files without leaking raw tokens to stdout", () => {
    const dir = mkdtempSync(join(tmpdir(), "voltaire-auth-test-"));
    chmodSync(dir, 0o700);
    try {
      const tokenPath = join(dir, "sandbox.token");
      const res = spawnSync(
        "node",
        [
          "scripts/smthrs-auth.mjs",
          "mint",
          "--scope",
          "read:runs",
          "--ttl",
          "5m",
          "--run",
          "test-run-1",
          "--out",
          tokenPath,
          "--json",
        ],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            SMITHERS_TOKEN: "voltaire-unit-test-signing-key-0123456789abcdef",
          },
        },
      );
      assert.equal(res.status, 0, res.stderr);
      const rawToken = readFileSync(tokenPath, "utf8").trim();
      assert.ok(rawToken.length > 20, "expected non-empty signed token");
      assert.equal(statSync(tokenPath).mode & 0o777, 0o600, "token file must be mode 0600");

      // Stdout and receipt must never contain the raw token
      assert.equal(res.stdout.includes(rawToken), false, "raw token must not appear on stdout");
      assert.equal(res.stderr.includes(rawToken), false, "raw token must not appear on stderr");

      const receipt = JSON.parse(readFileSync(`${tokenPath}.json`, "utf8"));
      assert.equal(receipt.repository, "evmts/voltaire");
      assert.deepEqual(receipt.scopes, ["read:runs"]);
      assert.equal(receipt.runId, "test-run-1");
      assert.equal(receipt.redacted, true);
      assert.equal(JSON.stringify(receipt).includes(rawToken), false);
      assert.equal(statSync(`${tokenPath}.json`).mode & 0o777, 0o600, "receipt file must be mode 0600");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to write minted tokens into group/world-writable directories", () => {
    const dir = mkdtempSync(join(tmpdir(), "voltaire-auth-unsafe-"));
    chmodSync(dir, 0o777);
    try {
      const res = spawnSync(
        "node",
        ["scripts/smthrs-auth.mjs", "mint", "--scope", "read:runs", "--ttl", "5m", "--out", join(dir, "t.tok")],
        {
          cwd: root,
          encoding: "utf8",
          env: { ...process.env, SMITHERS_TOKEN: "voltaire-unit-test-signing-key" },
        },
      );
      assert.notEqual(res.status, 0);
      assert.match(res.stderr, /group\/world-writable/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("Factory projection, QuickJS CI realm contracts, and switchover policy", () => {
  it("projects apiVersion 1, push/land switchover, protectedPaths, and person-only approvals", () => {
    const factory = JSON.parse(readFileSync(join(root, ".smithers/factory.json"), "utf8"));
    assert.equal(factory.apiVersion, 1);
    assert.equal(factory.github.mirror, "push");
    assert.equal(factory.github.issues, "two-way");
    assert.equal(factory.github.changes, "land");
    assert.deepEqual(factory.github.maintainers, ["roninjin10"]);
    assert.deepEqual(factory.policy.approvals, { approve: "person", merge: "person" });

    for (const requiredPath of [".github", ".agents/uphill", ".mcp.json", "packages/voltaire-zig/src/crypto", "scripts/publish-npm.mjs"]) {
      assert.ok(factory.github.protectedPaths.includes(requiredPath), `protectedPaths missing ${requiredPath}`);
    }

    const triggerFlows = new Set(factory.contributes.triggers.map((t) => t.flow));
    for (const flow of ["ci", "uphill", "docs-publish", "release"]) {
      assert.ok(triggerFlows.has(flow), `contributes.triggers missing ${flow}`);
    }
  });

  it("keeps every triggered repository CI flow strictly QuickJS-realm compatible", () => {
    const allowedModules = new Set(["@smthrs/flow", "@smthrs/plan", "@smthrs/sandbox", "effect"]);
    const factory = JSON.parse(readFileSync(join(root, ".smithers/factory.json"), "utf8"));
    const triggeredFlows = [...new Set(factory.contributes.triggers.map((t) => t.flow))];

    for (const flowId of triggeredFlows) {
      assert.match(flowId, /^[a-z0-9][a-z0-9_-]{0,63}$/, `invalid CI flow id ${flowId}`);
      const file = join(root, `.smithers/flows/${flowId}/flow.ts`);
      assert.equal(existsSync(file), true, `missing ${file}`);
      const source = readFileSync(file, "utf8");
      assert.ok(source.includes(`Flow.make("${flowId}"`), `${file} must declare Flow.make("${flowId}", ...)`);

      for (const match of source.matchAll(/import\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g)) {
        const mod = match[1];
        assert.ok(allowedModules.has(mod), `${file} imports disallowed QuickJS realm module ${mod}`);
      }
    }
  });
});

describe("Personalized multi-audience Factory Home UI (@smthrs/views)", () => {
  it("validates against @smthrs/views Home.read with zero skipped blocks and clean audience separation", () => {
    const raw = readFileSync(join(root, ".smithers/home.json"), "utf8");
    const parsed = Home.read(raw);
    assert.equal(parsed._tag, "Declared");
    assert.equal(parsed.skipped, 0);
    assert.equal(parsed.docs, "https://voltaire.tevm.sh/llms.txt");
    assert.equal(parsed.contributors, "role");

    const viewerSections = Home.visible(parsed.sections, "everyone");
    const contributorSections = Home.visible(parsed.sections, "contributor");
    const maintainerSections = Home.visible(parsed.sections, "maintainer");

    assert.equal(viewerSections.length, 1, "viewer sees public showcase only");
    assert.equal(contributorSections.length, 2, "contributor sees Contributor Workbench + showcase");
    assert.equal(maintainerSections.length, 3, "maintainer sees Command Center + Contributor Workbench + showcase");

    assert.equal(maintainerSections[0].title, "Command Center");
    assert.equal(contributorSections[0].title, "Contributor Workbench");

    const allBlockTypes = parsed.sections.flatMap((s) => s.blocks.map((b) => b.type));
    assert.equal(allBlockTypes.includes("markdown"), false, "no markdown blocks that delay pre-clone first paint");
  });
});

describe("Obsidian Wiki, Mythical History, and Lighthouse Backpressure Report", () => {
  it("has a complete Obsidian-compatible wiki graph with valid backlinks and real source inputs", () => {
    const catalog = JSON.parse(readFileSync(join(root, ".smithers/coding-project.json"), "utf8"));
    const pages = catalog.pages;
    assert.ok(pages.length >= 10, `expected >= 10 wiki pages, got ${pages.length}`);

    const mdStems = new Set(
      readdirSync(join(root, ".smithers/wiki/pages"))
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, "")),
    );

    for (const page of pages) {
      const full = join(root, page.document);
      assert.equal(existsSync(full), true, `missing wiki page ${page.document}`);
      const content = readFileSync(full, "utf8");
      assert.match(content, /^---\n(?:[\s\S]*?\n)?title:/);
      assert.match(content, /^---\n(?:[\s\S]*?\n)?tags:/);
      for (const input of page.inputs) {
        assert.equal(existsSync(join(root, input)), true, `wiki page ${page.id} references missing input ${input}`);
      }
      for (const m of content.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
        assert.ok(mdStems.has(m[1].trim()), `wiki page ${page.id} has broken wikilink [[${m[1]}]]`);
      }
    }
  });

  it("maintains an acyclic Mythical History epic DAG referencing real repository paths", () => {
    const epicsDoc = JSON.parse(readFileSync(join(root, ".smithers/mythical/epics.json"), "utf8"));
    assert.equal(epicsDoc.schemaVersion, 1);
    assert.ok(epicsDoc.epics.length >= 7);

    const byId = new Map(epicsDoc.epics.map((e) => [e.id, e]));
    const visiting = new Set();
    const visited = new Set();
    const checkCycle = (id) => {
      if (visited.has(id)) return;
      assert.equal(visiting.has(id), false, `cycle detected at epic ${id}`);
      visiting.add(id);
      const epic = byId.get(id);
      assert.ok(epic, `unknown epic ${id}`);
      for (const dep of epic.dependsOn ?? []) checkCycle(dep);
      visiting.delete(id);
      visited.add(id);
    };
    for (const epic of epicsDoc.epics) {
      checkCycle(epic.id);
      assert.equal(
        existsSync(join(root, `.smithers/wiki/pages/${epic.wikiPage}.md`)),
        true,
        `epic ${epic.id} wikiPage ${epic.wikiPage} missing`,
      );
      for (const p of epic.paths) {
        assert.equal(existsSync(join(root, p)), true, `epic ${epic.id} path ${p} missing`);
      }
    }
  });

  it("generates a Lighthouse-style HTML + JSON backpressure report with factory-and-ci at 100", () => {
    const outDir = mkdtempSync(join(tmpdir(), "voltaire-audit-test-"));
    try {
      const res = spawnSync("node", ["scripts/audit-report.mjs", "--out-dir", outDir, "--strict"], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${join(process.env.HOME ?? "", ".uphill/bin")}:${join(process.env.HOME ?? "", ".bun/bin")}:${process.env.PATH ?? ""}`,
        },
      });
      assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
      const json = JSON.parse(readFileSync(join(outDir, "audit-report.json"), "utf8"));
      const html = readFileSync(join(outDir, "audit-report.html"), "utf8");
      assert.equal(json.repository, "evmts/voltaire");
      assert.equal(json.categories.length, 5);
      const factoryCat = json.categories.find((c) => c.id === "factory-and-ci");
      assert.equal(factoryCat?.score, 100);
      assert.ok(html.includes("Voltaire Backpressure Audit Report"));
      assert.ok(html.includes("gauge-score"));
      assert.ok(html.includes("Execution Trust"));
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
