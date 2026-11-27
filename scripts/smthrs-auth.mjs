#!/usr/bin/env node
/**
 * One-time-use & short-lived authentication helper for Voltaire sandboxes and
 * Bring-Your-Own-Agent (BYOA) MCP sessions on Smithers Cloud.
 *
 * Security invariants:
 * - Never prints long-lived credentials, session cookies, or raw env secrets.
 * - Mints scope-attenuated, short-lived tokens for sandboxes and agent lanes
 *   via `smthrs token mint` and writes them only to mode-0600 files (or
 *   emits a single-use BYOA attach / OAuth 2.1 PKCE bootstrap snippet).
 * - Enforces trust boundaries: untrusted / external runs never receive cache
 *   write credentials and can never bypass person-only gates.
 *
 * Usage:
 *   node scripts/smthrs-auth.mjs status [--offline] [--json]
 *   node scripts/smthrs-auth.mjs mint --scope <scope> [--ttl 15m] [--run <id>] [--flow <id>] --out <mode-600-file>
 *   node scripts/smthrs-auth.mjs attach-instructions [--branch <name>] [--json]
 *   node scripts/smthrs-auth.mjs verify-trust [--json]
 */
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const REPO = "evmts/voltaire";
const CLOUD_ORIGIN = (process.env.SMITHERS_API_URL ?? "https://smithers.sh").replace(/\/$/, "");
const MCP_URL = `${CLOUD_ORIGIN}/${REPO}/mcp`;
const OAUTH_DISCOVERY_URL = `${CLOUD_ORIGIN}/.well-known/oauth-protected-resource`;
const CACHE_URL = "https://build.smithers.sh";

const args = process.argv.slice(2);
const cmd = args[0] ?? "status";
const asJson = args.includes("--json");
const offline = args.includes("--offline");

function flagValue(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

function flagValues(flag) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

function emit(payload, humanLines) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${humanLines.join("\n")}\n`);
  }
}

function computeTrust() {
  const isFork = process.env.GITHUB_HEAD_REPO_FORK === "true";
  const forcedUntrusted = process.env.SMITHERS_UNTRUSTED === "1";
  const inSandbox = Boolean(process.env.SMITHERS_RUN_ID || process.env.SMITHERS_SANDBOX_ID || process.env.SMITHERS_CLOUD === "1");
  const hasCacheWrite = Boolean(process.env.SMITHERS_CACHE_WRITE_TOKEN) && !forcedUntrusted && !isFork;
  const hasCacheRead = Boolean(process.env.SMITHERS_CACHE_READ_TOKEN) || hasCacheWrite;
  const hasGatewayToken = Boolean(process.env.SMITHERS_TOKEN);
  const trusted = !forcedUntrusted && !isFork && (inSandbox || hasCacheWrite || process.env.SMITHERS_TRUSTED === "1");

  return {
    repository: REPO,
    mode: trusted ? "trusted" : "untrusted",
    cacheEndpoint: CACHE_URL,
    cacheAccess: hasCacheWrite ? "read-write" : hasCacheRead ? "read-only" : "local-only",
    cacheWriteBlocked: !hasCacheWrite,
    canSkipGates: false,
    hasMintingKey: hasGatewayToken,
    mcpEndpoint: MCP_URL,
    oauthDiscovery: OAUTH_DISCOVERY_URL,
  };
}

async function probeCloud() {
  if (offline) return { probed: false, mcpReachable: null, oauthDiscoveryOk: null, scopes: [] };
  try {
    const [mcpRes, oauthRes] = await Promise.all([
      fetch(MCP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "voltaire-smthrs-auth", version: "1.0.0" },
          },
        }),
      }),
      fetch(OAUTH_DISCOVERY_URL),
    ]);
    const mcpBody = mcpRes.ok ? await mcpRes.json() : null;
    const oauthBody = oauthRes.ok ? await oauthRes.json() : null;
    return {
      probed: true,
      mcpReachable: mcpRes.ok && Boolean(mcpBody?.result?.serverInfo?.name),
      serverName: mcpBody?.result?.serverInfo?.name ?? null,
      protocolVersion: mcpBody?.result?.protocolVersion ?? null,
      oauthDiscoveryOk: oauthRes.ok && Array.isArray(oauthBody?.scopes_supported),
      scopes: oauthBody?.scopes_supported ?? [],
    };
  } catch (err) {
    return {
      probed: true,
      mcpReachable: false,
      oauthDiscoveryOk: false,
      scopes: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

if (cmd === "verify-trust") {
  const trust = computeTrust();
  emit(trust, [
    `Repository:   ${trust.repository}`,
    `Trust mode:   ${trust.mode}`,
    `Object store: ${trust.cacheEndpoint} (${trust.cacheAccess})`,
    `Write guard:  ${trust.cacheWriteBlocked ? "cache writes blocked (safe for untrusted runs)" : "trusted write-enabled"}`,
    `Gate bypass:  forbidden (canSkipGates=false)`,
  ]);
  process.exit(0);
}

if (cmd === "status") {
  const trust = computeTrust();
  const cloud = await probeCloud();
  const result = { trust, cloud };
  emit(result, [
    `Smithers Cloud MCP:  ${trust.mcpEndpoint}`,
    `OAuth 2.1 Discovery: ${trust.oauthDiscovery}`,
    `Trust Mode:          ${trust.mode} (cache: ${trust.cacheAccess})`,
    `Minting Key Present: ${trust.hasMintingKey ? "yes (SMITHERS_TOKEN set)" : "no (set SMITHERS_TOKEN or use OAuth/attach)"}`,
    ...(cloud.probed
      ? [
          `Live MCP Probe:      ${cloud.mcpReachable ? `OK (${cloud.serverName} / ${cloud.protocolVersion})` : "unreachable"}`,
          `Live OAuth Scopes:   ${cloud.scopes.join(", ") || "unavailable"}`,
        ]
      : ["Live MCP Probe:      skipped (--offline)"]),
  ]);
  process.exit(0);
}

if (cmd === "attach-instructions") {
  const branch = flagValue("--branch", "main");
  const payload = {
    repository: REPO,
    branch,
    mcpEndpoint: MCP_URL,
    oauthDiscovery: OAUTH_DISCOVERY_URL,
    attachEndpoints: {
      intent: `${CLOUD_ORIGIN}/api/attach/intents`,
      claim: `${CLOUD_ORIGIN}/api/attach/claims`,
      consent: `${CLOUD_ORIGIN}/api/attach/consent`,
      approve: `${CLOUD_ORIGIN}/api/attach/approvals`,
      token: `${CLOUD_ORIGIN}/api/attach/tokens`,
      revoke: `${CLOUD_ORIGIN}/api/attach/revocations`,
      mcp: `${CLOUD_ORIGIN}/api/attach/mcp/${REPO}/${branch}`,
    },
    claudeCode: `claude mcp add --transport http smithers-voltaire ${MCP_URL}`,
    codex: `codex mcp add smithers-voltaire --url ${MCP_URL}`,
    note: "Authenticate via browser OAuth 2.1 PKCE (S256) or one-time BYOA pairing code. Every write is attributed as <login> (agent); person-only actions remain blocked.",
  };
  emit(payload, [
    `Attach an agent to ${REPO} (${branch}) via Smithers Cloud MCP:`,
    `  Endpoint:    ${MCP_URL}`,
    `  Claude Code: ${payload.claudeCode}`,
    `  Codex:       ${payload.codex}`,
    `  One-time attach flow: POST /api/attach/intents -> agent /api/attach/claims (PKCE S256 + pairing code) -> human consent -> single-use approval code -> 8h scoped bearer token.`,
    `  Attribution: Every write is attributed as <login> (agent). Merging, final triage, committing TODOs, and secrets stay person-only.`,
  ]);
  process.exit(0);
}

if (cmd === "mint") {
  const scopes = flagValues("--scope");
  const ttl = flagValue("--ttl", "15m");
  const runId = flagValue("--run", undefined);
  const flowId = flagValue("--flow", undefined);
  const outFile = flagValue("--out", undefined);

  if (scopes.length === 0) {
    process.stderr.write("error: pass at least one --scope (read:runs, write:runs, approve:runs)\n");
    process.exit(1);
  }
  if (!outFile) {
    process.stderr.write("error: --out <path> is required (tokens are written to mode-0600 files, never printed to logs)\n");
    process.exit(1);
  }
  if (!process.env.SMITHERS_TOKEN?.trim()) {
    process.stderr.write("error: SMITHERS_TOKEN is not set in the environment\n");
    process.exit(1);
  }

  const outPath = resolve(outFile);
  const parentDir = dirname(outPath);
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true, mode: 0o700 });
  const parentMode = statSync(parentDir).mode & 0o022;
  if (parentMode !== 0) {
    process.stderr.write(`error: refuse to write token into group/world-writable directory ${parentDir}\n`);
    process.exit(1);
  }

  const smthrsBin = resolve(process.cwd(), "scripts/smthrs");
  const cmdArgs = ["token", "mint", "--format", "json", "--ttl", ttl];
  for (const s of scopes) cmdArgs.push("--scope", s);
  if (runId) cmdArgs.push("--run", runId);
  if (flowId) cmdArgs.push("--flow", flowId);

  const res = spawnSync(smthrsBin, cmdArgs, { encoding: "utf8", env: process.env });
  if (res.status !== 0) {
    process.stderr.write(`error: smthrs token mint failed (exit ${res.status}): ${(res.stderr || "").slice(0, 300)}\n`);
    process.exit(res.status ?? 1);
  }

  const minted = JSON.parse(res.stdout);
  if (typeof minted?.token !== "string" || minted.token.length === 0) {
    process.stderr.write("error: smthrs token mint returned no token\n");
    process.exit(1);
  }

  // Write raw token to mode-0600 file and non-secret scope receipt beside it.
  writeFileSync(outPath, `${minted.token}\n`, { mode: 0o600 });
  chmodSync(outPath, 0o600);

  const receipt = {
    repository: REPO,
    issuedAt: new Date().toISOString(),
    expiresAt: minted.expiresAt,
    scopes: minted.scopes,
    procedures: minted.procedures,
    ...(minted.runId ? { runId: minted.runId } : {}),
    ...(minted.flowId ? { flowId: minted.flowId } : {}),
    tokenFile: outPath,
    redacted: true,
  };
  const receiptPath = `${outPath}.json`;
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  chmodSync(receiptPath, 0o600);

  emit(receipt, [
    `Minted scoped short-lived token (redacted from stdout):`,
    `  Token file (0600): ${outPath}`,
    `  Receipt:           ${receiptPath}`,
    `  Scopes:            ${receipt.scopes.join(", ")}`,
    `  Expires at:        ${receipt.expiresAt}`,
  ]);
  process.exit(0);
}

process.stderr.write(`Unknown command: ${cmd}. Use: status | mint | attach-instructions | verify-trust\n`);
process.exit(1);
