#!/usr/bin/env node
/**
 * Voltaire Backpressure Audit Report Generator (Lighthouse-style HTML + JSON).
 *
 * Combines:
 * - Uphill continuous category scores, audits, and opportunities (.uphill/report.json)
 * - Smithers Cloud shared object store & trust posture (trusted vs untrusted execution)
 * - WASM bundle & per-crypto footprint breakdown
 * - Wiki, Mythical History, and Factory projection health
 *
 * Outputs:
 * - .smithers/reports/audit-report.json
 * - .smithers/reports/audit-report.html (self-contained Lighthouse-grade UI)
 *
 * Optional flags:
 *   --out-dir <dir>       Output directory (default: .smithers/reports)
 *   --skip-uphill         Read existing .uphill/report.json without re-running uphill
 *   --upload-artifacts    PUT HTML + JSON to Smithers Cloud R2 artifact store
 *                         (http://artifacts.smithers.internal/<name>) when inside a CiJob box
 *   --strict              Exit non-zero if factory-and-ci category score < 100
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const outDir = resolve(root, argValue("--out-dir", ".smithers/reports"));
const skipUphill = args.includes("--skip-uphill");
const uploadArtifacts = args.includes("--upload-artifacts");
const strict = args.includes("--strict");

function findUphillBin() {
  const candidates = [
    process.env.UPHILL_BIN,
    join(process.env.HOME ?? "", ".uphill/bin/uphill"),
    "uphill",
  ].filter(Boolean);
  for (const bin of candidates) {
    if (bin === "uphill" || existsSync(bin)) return bin;
  }
  return "uphill";
}

function runUphill() {
  const bin = findUphillBin();
  const env = {
    ...process.env,
    PATH: `${join(process.env.HOME ?? "", ".uphill/bin")}:${join(process.env.HOME ?? "", ".bun/bin")}:${process.env.PATH ?? ""}`,
  };
  const res = spawnSync(bin, ["--compact"], { cwd: root, env, encoding: "utf8" });
  return { status: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

function detectTrustPosture() {
  const isFork = process.env.GITHUB_HEAD_REPO_FORK === "true";
  const explicitlyUntrusted = process.env.SMITHERS_UNTRUSTED === "1";
  const inCloudSandbox =
    Boolean(process.env.SMITHERS_RUN_ID) ||
    Boolean(process.env.SMITHERS_SANDBOX_ID) ||
    process.env.SMITHERS_CLOUD === "1";
  const hasCacheWrite = Boolean(process.env.SMITHERS_CACHE_WRITE_TOKEN) && !explicitlyUntrusted && !isFork;
  const hasCacheRead = Boolean(process.env.SMITHERS_CACHE_READ_TOKEN) || hasCacheWrite;
  const trusted = !explicitlyUntrusted && !isFork && (inCloudSandbox || hasCacheWrite || process.env.SMITHERS_TRUSTED === "1");

  return {
    mode: trusted ? "trusted" : "untrusted",
    label: trusted ? "Trusted Sandbox / Maintainer" : "Untrusted / Read-Only Cache",
    cacheEndpoint: "https://build.smithers.sh",
    cacheAccess: hasCacheWrite ? "read-write" : hasCacheRead ? "read-only" : "local-only",
    canPopulateSharedCache: hasCacheWrite,
    canSkipGates: false,
    mcpEndpoint: "https://smithers.sh/evmts/voltaire/mcp",
    cloudUiUrl: "https://smithers.sh/evmts/voltaire",
  };
}

function collectWasmFootprint() {
  const entries = [];
  const mainWasm = join(root, "packages/voltaire-ts/src/wasm-loader/primitives.wasm");
  if (existsSync(mainWasm)) {
    const buf = readFileSync(mainWasm);
    entries.push({
      name: "primitives.wasm (full)",
      rawBytes: buf.length,
      gzipBytes: gzipSync(buf, { level: 9 }).length,
      budgetRawBytes: 350 * 1024,
    });
  }
  const cryptoDir = join(root, "packages/voltaire-zig/wasm/crypto");
  if (existsSync(cryptoDir)) {
    for (const file of readdirSync(cryptoDir).filter((f) => f.endsWith(".wasm")).sort()) {
      const full = join(cryptoDir, file);
      const buf = readFileSync(full);
      entries.push({
        name: `crypto/${file}`,
        rawBytes: buf.length,
        gzipBytes: gzipSync(buf, { level: 9 }).length,
        budgetRawBytes: 120 * 1024,
      });
    }
  }
  return entries;
}

function readRevInfo() {
  const jj = spawnSync("jj", ["--no-pager", "log", "-r", "@", "--no-graph", "-T", 'commit_id.short(12) ++ "\\n" ++ change_id.short(12) ++ "\\n" ++ description.first_line()'], {
    cwd: root,
    encoding: "utf8",
  });
  if (jj.status === 0 && jj.stdout.trim()) {
    const [commit, change, summary] = jj.stdout.trim().split("\n");
    return { commit: commit ?? "unknown", change: change ?? "", summary: summary ?? "" };
  }
  return { commit: process.env.GITHUB_SHA?.slice(0, 12) ?? "working-tree", change: "", summary: "" };
}

function bandOf(score) {
  if (score === null || score === undefined) return "none";
  if (score >= 90) return "good";
  if (score >= 50) return "average";
  return "poor";
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInlineCode(value) {
  return esc(value).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function fmtBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${bytes} B`;
}

function gaugeSvg(score, label, size = 104, href = "") {
  const safeScore = typeof score === "number" ? Math.max(0, Math.min(100, Math.round(score))) : null;
  const band = bandOf(safeScore);
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = safeScore === null ? 0 : (safeScore / 100) * c;
  const tag = href ? "a" : "div";
  const attrs = href ? ` href="${esc(href)}"` : "";
  return `<${tag} class="gauge ${band}"${attrs} style="--size:${size}px">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="${r}" />
      <circle class="arc" cx="50" cy="50" r="${r}" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)" />
    </svg>
    <span class="gauge-score">${safeScore === null ? "—" : safeScore}</span>
    <span class="gauge-label">${esc(label)}</span>
  </${tag}>`;
}

function formatMetricValue(value, kind, unit) {
  if (value === true) return "pass";
  if (value === false) return "fail";
  if (typeof value === "number") {
    if (kind === "size" || unit === "B") return fmtBytes(value);
    return String(value);
  }
  return String(value ?? "");
}

function normalizeUphillReport(raw) {
  const categories = [];
  const rawCats = raw?.categories ?? raw?.groups ?? {};
  const list = Array.isArray(rawCats)
    ? rawCats
    : Object.entries(rawCats).map(([id, val]) => ({ id, ...(val && typeof val === "object" ? val : {}) }));

  const metricMetaByKey = new Map();

  for (const cat of list) {
    const id = String(cat.id ?? cat.name ?? "category");
    const title = String(cat.title ?? id);
    const description = String(cat.description ?? "");
    const score = typeof cat.score === "number" ? Math.round(cat.score) : null;
    const rawAudits = Array.isArray(cat.metrics)
      ? cat.metrics
      : Array.isArray(cat.audits)
        ? cat.audits
        : cat.metrics && typeof cat.metrics === "object"
          ? Object.entries(cat.metrics).map(([mid, mv]) => ({ id: mid, ...(mv && typeof mv === "object" ? mv : {}) }))
          : [];
    const audits = rawAudits.map((m) => {
      const metricId = String(m.id ?? m.name ?? "metric");
      const kind = String(m.kind ?? "");
      const unit = m.unit ?? null;
      const better = String(m.better ?? "lower");
      const defaultTarget = typeof m.default === "number" ? m.default : typeof m.target === "number" ? m.target : null;
      metricMetaByKey.set(`${id}:${metricId}`, { kind, unit, better });

      const items = Array.isArray(m.items)
        ? m.items
        : m.items && typeof m.items === "object"
          ? Object.entries(m.items).map(([k, v]) => ({ item: k, ...(v && typeof v === "object" ? v : {}) }))
          : [];

      const failedItems = items.filter((it) => {
        if (it.value === false || it.pass === false || it.status === "fail" || it.value === "fail") return true;
        const itemTarget = typeof it.target === "number" ? it.target : defaultTarget;
        if (typeof it.value === "number" && itemTarget !== null) {
          return better === "higher" ? it.value < itemTarget : it.value > itemTarget;
        }
        if (typeof it.score === "number" && it.score < 90) return true;
        return false;
      });

      return {
        id: metricId,
        title: String(m.title ?? metricId),
        kind,
        unit,
        better,
        description: String(m.description ?? ""),
        score: typeof m.score === "number" ? Math.round(m.score) : null,
        weight: typeof m.weight === "number" ? m.weight : 1,
        totalItems: items.length,
        failedCount: failedItems.length,
        sampleFailures: failedItems.slice(0, 20).map((it) => {
          const itemTarget = typeof it.target === "number" ? it.target : defaultTarget;
          return {
            item: String(it.item ?? it.name ?? it.label ?? ""),
            value: formatMetricValue(it.display ?? it.formatted ?? it.value, kind, unit),
            target: itemTarget !== null ? formatMetricValue(itemTarget, kind, unit) : "",
            note: String(it.note ?? ""),
          };
        }),
      };
    });
    categories.push({ id, title, description, score, audits });
  }

  const scored = categories.filter((c) => typeof c.score === "number");
  const overall = scored.length > 0 ? Math.round(scored.reduce((s, c) => s + c.score, 0) / scored.length) : null;

  const opportunities = (Array.isArray(raw?.opportunities) ? raw.opportunities : []).map((o) => {
    const cat = String(o.category ?? o.group ?? "");
    const metric = String(o.metric ?? o.name ?? "");
    const meta = metricMetaByKey.get(`${cat}:${metric}`) ?? { kind: "", unit: null };
    const currentRaw = o.current ?? o.from ?? o.value;
    const targetRaw = o.target ?? o.to;
    return {
      gain: Number(o.gain ?? o.delta ?? o.points ?? 0),
      category: cat,
      metric,
      item: o.item ? String(o.item) : o.items > 1 ? `${o.items} items` : "",
      itemsCount: typeof o.items === "number" ? o.items : 1,
      current: formatMetricValue(currentRaw, meta.kind, meta.unit),
      target: formatMetricValue(targetRaw, meta.kind, meta.unit),
    };
  });

  const changes = Array.isArray(raw?.changes) ? raw.changes : [];

  return { overall, categories, opportunities, changes };
}

function renderHtml(report) {
  const { overall, categories, opportunities, trust, wasm, revision, generatedAt } = report;
  const trustClass = trust.mode === "trusted" ? "good" : "average";

  const categoryCards = categories
    .map((cat) => {
      const auditRows = cat.audits
        .map((a) => {
          const band = bandOf(a.score);
          const failuresHtml =
            a.sampleFailures.length === 0
              ? `<p class="muted small">All ${a.totalItems} checked items meet target.</p>`
              : `<ul class="fail-list">${a.sampleFailures
                  .map(
                    (f) =>
                      `<li><code>${esc(f.item)}</code> ${f.value !== "" ? `<span class="chip poor">${esc(f.value)}</span>` : ""} ${
                        f.target !== "" ? `<span class="muted small">target ${esc(f.target)}</span>` : ""
                      } ${f.note ? `<div class="note-line">${esc(f.note)}</div>` : ""}</li>`,
                  )
                  .join("")}</ul>`;
          return `<details class="audit-row" data-status="${a.failedCount > 0 ? "flagged" : "pass"}" data-search="${esc(`${cat.id} ${a.id} ${a.description} ${a.sampleFailures.map((f) => `${f.item} ${f.note}`).join(" ")}`.toLowerCase())}">
            <summary>
              <span class="shape ${band}" aria-hidden="true"></span>
              <span class="audit-name"><strong>${esc(a.id)}</strong><span class="muted small"> ${renderInlineCode(a.description)}</span></span>
              <span class="audit-meta">
                ${a.failedCount > 0 ? `<span class="chip poor">${a.failedCount}/${a.totalItems} flagged</span>` : `<span class="chip good">${a.totalItems} pass</span>`}
                <span class="chip ${band}">${a.score === null ? "—" : a.score}</span>
              </span>
            </summary>
            <div class="audit-body">${failuresHtml}</div>
          </details>`;
        })
        .join("");

      return `<section class="category" id="cat-${esc(cat.id)}" data-category="${esc(cat.id)}">
        <div class="category-head">
          ${gaugeSvg(cat.score, cat.title, 112)}
          <p class="muted">${esc(cat.description)}</p>
        </div>
        <div class="audit-list">${auditRows}</div>
      </section>`;
    })
    .join("");

  const opportunitiesHtml =
    opportunities.length === 0
      ? `<p class="muted">No high-impact opportunities flagged above baseline.</p>`
      : `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Impact</th><th>Category</th><th>Metric</th><th>Current → Target</th></tr></thead>
          <tbody>${opportunities
            .slice(0, 15)
            .map(
              (o) => `<tr>
                <td><span class="chip good">+${esc(o.gain)}</span></td>
                <td><a class="cat-link" href="#cat-${esc(o.category)}">${esc(o.category)}</a></td>
                <td><code>${esc(o.metric)}</code> ${o.item ? `<span class="muted">${esc(o.item)}</span>` : ""}</td>
                <td class="mono">${esc(o.current)} → ${esc(o.target)}</td>
              </tr>`,
            )
            .join("")}</tbody>
        </table></div>`;

  const markdownSummary = [
    `### Voltaire Backpressure Audit Report (\`${revision.commit}\`)`,
    ``,
    `- **Overall:** **${overall ?? "—"}/100** | **Execution Trust:** ${trust.label} | **Cache:** \`${trust.cacheEndpoint}\` (${trust.cacheAccess})`,
    ``,
    `| Category | Score | Flagged Audits |`,
    `| --- | ---: | ---: |`,
    ...categories.map((c) => {
      const flagged = c.audits.filter((a) => a.failedCount > 0).length;
      return `| ${c.title} | **${c.score ?? "—"}** | ${flagged}/${c.audits.length} |`;
    }),
  ].join("\n");

  const wasmHtml =
    wasm.length === 0
      ? `<p class="muted">No compiled WASM artifacts found on disk yet.</p>`
      : `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Artifact</th><th>Raw</th><th>Gzip</th><th>Budget</th><th>Status</th></tr></thead>
          <tbody>${wasm
            .map((w) => {
              const ok = w.rawBytes <= w.budgetRawBytes;
              return `<tr>
                <td><code>${esc(w.name)}</code></td>
                <td class="mono">${fmtBytes(w.rawBytes)}</td>
                <td class="mono">${fmtBytes(w.gzipBytes)}</td>
                <td class="mono">${fmtBytes(w.budgetRawBytes)}</td>
                <td><span class="chip ${ok ? "good" : "average"}">${ok ? "within budget" : "over target"}</span></td>
              </tr>`;
            })
            .join("")}</tbody>
        </table></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Voltaire Backpressure Audit Report · Smithers Cloud</title>
<style>
:root{--bg:#ffffff;--surface:#f8f9fa;--fg:#1f2328;--muted:#59636e;--line:#d0d7de;--focus:#0969da;--good:#00c853;--good-fg:#007a33;--good-bg:#e6f9ee;--average:#ff9800;--average-fg:#b45309;--average-bg:#fff4e5;--poor:#f44336;--poor-fg:#c62828;--poor-bg:#ffebee;--none:#8b949e;--none-fg:#57606a;--none-bg:#eaeef2}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--surface:#161b22;--fg:#e6edf3;--muted:#8b949e;--line:#30363d;--focus:#58a6ff;--good-fg:#3fb950;--good-bg:rgba(63,185,80,.15);--average-fg:#d29922;--average-bg:rgba(210,153,34,.15);--poor-fg:#f85149;--poor-bg:rgba(248,81,73,.15);--none-fg:#8b949e;--none-bg:#21262d}}
[data-theme="light"]{--bg:#ffffff;--surface:#f8f9fa;--fg:#1f2328;--muted:#59636e;--line:#d0d7de;--focus:#0969da;--good:#00c853;--good-fg:#007a33;--good-bg:#e6f9ee;--average:#ff9800;--average-fg:#b45309;--average-bg:#fff4e5;--poor:#f44336;--poor-fg:#c62828;--poor-bg:#ffebee;--none:#8b949e;--none-fg:#57606a;--none-bg:#eaeef2}
[data-theme="dark"]{--bg:#0d1117;--surface:#161b22;--fg:#e6edf3;--muted:#8b949e;--line:#30363d;--focus:#58a6ff;--good-fg:#3fb950;--good-bg:rgba(63,185,80,.15);--average-fg:#d29922;--average-bg:rgba(210,153,34,.15);--poor-fg:#f85149;--poor-bg:rgba(248,81,73,.15);--none-fg:#8b949e;--none-bg:#21262d}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
header.topbar{border-bottom:1px solid var(--line);background:var(--surface);padding:14px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.brand{display:flex;align-items:center;gap:12px}
.brand h1{margin:0;font-size:17px;font-weight:700;letter-spacing:-0.01em}
.brand-sub{font-size:12px;color:var(--muted)}
.top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.btn{border:1px solid var(--line);background:var(--bg);color:var(--fg);padding:6px 11px;border-radius:6px;font:12px/1.2 inherit;font-weight:600;text-decoration:none;cursor:pointer}
.btn:hover{border-color:var(--focus);color:var(--focus)}
main{max-width:1040px;margin:0 auto;padding:24px 20px 64px}
.trust-banner{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px 16px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface);margin-bottom:24px}
.kv-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}
.kv-val{font-size:13px;font-weight:600;margin-top:2px;overflow-wrap:break-word}
.table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.gauges-hero{display:flex;flex-wrap:wrap;justify-content:center;gap:20px 32px;padding:20px 12px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);margin-bottom:14px}
.gauge{position:relative;display:flex;flex-direction:column;align-items:center;min-width:116px;text-decoration:none;color:inherit;padding:6px;border-radius:8px}
.gauge:hover{background:color-mix(in srgb,var(--focus) 8%,transparent)}
.gauge svg{width:var(--size,104px);height:var(--size,104px)}
.gauge .track{fill:var(--bg);stroke:var(--line);stroke-width:8}
.gauge.good .track{fill:var(--good-bg)}.gauge.average .track{fill:var(--average-bg)}.gauge.poor .track{fill:var(--poor-bg)}
.gauge .arc{fill:none;stroke-width:8;stroke-linecap:round;stroke:var(--none);transition:stroke-dasharray .6s ease}
.gauge.good .arc{stroke:var(--good)}.gauge.average .arc{stroke:var(--average)}.gauge.poor .arc{stroke:var(--poor)}
.gauge-score{position:absolute;top:6px;left:0;right:0;height:var(--size,104px);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums}
.gauge.good .gauge-score{color:var(--good-fg)}.gauge.average .gauge-score{color:var(--average-fg)}.gauge.poor .gauge-score{color:var(--poor-fg)}.gauge.none .gauge-score{color:var(--none-fg)}
.gauge-label{margin-top:8px;font-size:13px;font-weight:600;text-align:center}
.scale{display:flex;justify-content:center;gap:20px;font-size:12px;color:var(--muted);padding:4px 0 22px}
.scale span{display:inline-flex;align-items:center;gap:6px}
.shape{display:inline-block;flex:none;width:11px;height:11px;background:var(--none);border-radius:50%}
.shape.good{background:var(--good)}.shape.average{background:var(--average);border-radius:2px}.shape.poor{width:0;height:0;background:none;border-radius:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:11px solid var(--poor)}
.filter-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 14px}
.search-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 24px}
.search-input{flex:1;min-width:220px;border:1px solid var(--line);background:var(--bg);color:var(--fg);padding:7px 12px;border-radius:8px;font:13px/1.3 inherit}
.search-input:focus{outline:2px solid var(--focus);outline-offset:-1px}
.cat-link{color:var(--focus);text-decoration:none;font-weight:600}
.cat-link:hover{text-decoration:underline}
.pill{border:1px solid var(--line);background:var(--surface);color:var(--fg);padding:6px 12px;border-radius:999px;font:12px/1 inherit;font-weight:600;cursor:pointer}
.pill[aria-pressed="true"]{background:var(--focus);border-color:var(--focus);color:#fff}
@media print{header.topbar .top-actions,.filter-bar,.search-bar{display:none!important}main{max-width:none;padding:12px}.category,.panel,.gauges-hero,.trust-banner{break-inside:avoid}}
.panel{border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-bottom:24px;background:var(--surface)}
.panel h2{margin:0 0 12px;font-size:15px;font-weight:700}
.data-table{width:100%;border-collapse:collapse;font-size:13px}
.data-table th,.data-table td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
.data-table th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.chip.good{background:var(--good-bg);color:var(--good-fg)}.chip.average{background:var(--average-bg);color:var(--average-fg)}.chip.poor{background:var(--poor-bg);color:var(--poor-fg)}.chip.none{background:var(--none-bg);color:var(--none-fg)}
.category{border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:24px;background:var(--bg)}
.category-head{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:16px}
.category-head p{max-width:640px;margin:6px 0 0}
.audit-row{border-top:1px solid var(--line)}
.audit-row summary{display:flex;align-items:center;gap:12px;padding:12px 4px;cursor:pointer;list-style:none}
.audit-row summary::-webkit-details-marker{display:none}
.audit-name{flex:1;min-width:0}
.audit-meta{display:flex;align-items:center;gap:6px;flex:none}
.audit-body{padding:0 10px 14px 26px}
.fail-list{margin:4px 0 0;padding-left:18px;font-size:13px}
.fail-list li{margin:6px 0}
.note-line{color:var(--muted);font-size:12px;margin-top:2px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-word}
code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
.muted{color:var(--muted)}.small{font-size:12px}
footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
</style>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <div>
      <h1>evmts/voltaire · Backpressure Audit Report</h1>
      <div class="brand-sub">Commit <code>${esc(revision.commit)}</code> · Generated ${esc(generatedAt)}</div>
    </div>
  </div>
  <div class="top-actions">
    <a class="btn" href="${esc(trust.cloudUiUrl)}" target="_blank" rel="noreferrer">Smithers Cloud</a>
    <a class="btn" href="${esc(trust.cloudUiUrl)}/-/wiki" target="_blank" rel="noreferrer">Wiki</a>
    <button class="btn" id="copy-md" type="button">Copy PR Summary</button>
    <button class="btn" id="theme-toggle" type="button">Toggle Theme</button>
  </div>
</header>
<main>
  <section class="trust-banner" aria-label="Execution trust and shared object store posture">
    <div><div class="kv-label">Execution Trust</div><div class="kv-val"><span class="chip ${trustClass}">${esc(trust.label)}</span></div></div>
    <div><div class="kv-label">Shared Object Store</div><div class="kv-val"><code>build.smithers.sh</code> (${esc(trust.cacheAccess)})</div></div>
    <div><div class="kv-label">Cache Poisoning Guard</div><div class="kv-val">${trust.canPopulateSharedCache ? "Write-authorized sandbox" : "Write blocked (untrusted)"}</div></div>
    <div><div class="kv-label">Cloud MCP Endpoint</div><div class="kv-val"><a class="cat-link mono" href="${esc(trust.mcpEndpoint)}" target="_blank" rel="noreferrer">smithers.sh/evmts/voltaire/mcp</a></div></div>
  </section>

  <section class="gauges-hero" aria-label="Category scores">
    ${gaugeSvg(overall, "Overall Health", 112)}
    ${categories.map((c) => gaugeSvg(c.score, c.title, 104, `#cat-${c.id}`)).join("")}
  </section>

  <div class="scale">
    <span><i class="shape poor"></i> 0–49 Poor</span>
    <span><i class="shape average"></i> 50–89 Needs Work</span>
    <span><i class="shape good"></i> 90–100 Good</span>
  </div>

  <div class="filter-bar" role="group" aria-label="Filter categories">
    <button class="pill" data-filter="all" aria-pressed="true" type="button">All Categories</button>
    ${categories.map((c) => `<button class="pill" data-filter="${esc(c.id)}" aria-pressed="false" type="button">${esc(c.title)} (${c.score ?? "—"})</button>`).join("")}
  </div>

  <div class="search-bar" role="search" aria-label="Filter audits">
    <input class="search-input" id="audit-search" type="search" placeholder="Search audits, files, or modules (e.g. zig-no-panic, Address, Abi)..." aria-label="Search audits">
    <button class="pill" data-status-filter="all" aria-pressed="true" type="button">All Audits</button>
    <button class="pill" data-status-filter="flagged" aria-pressed="false" type="button">Flagged Only</button>
    <button class="pill" data-status-filter="pass" aria-pressed="false" type="button">Passing Only</button>
  </div>

  <section class="panel">
    <h2>Top Backpressure Opportunities</h2>
    ${opportunitiesHtml}
  </section>

  <section class="panel">
    <h2>WASM &amp; Crypto Bundle Footprint</h2>
    ${wasmHtml}
  </section>

  ${categoryCards}

  <footer>
    <span>Voltaire Coding Factory · Powered by Smithers Cloud + Uphill</span>
    <span>Untrusted runs are encouraged and execute with read-only cache access only.</span>
  </footer>
</main>
<script>
const rootEl = document.documentElement;
const mdSummary = ${JSON.stringify(markdownSummary)};
document.getElementById("theme-toggle").addEventListener("click", () => {
  const cur = rootEl.getAttribute("data-theme");
  const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  rootEl.setAttribute("data-theme", dark ? "light" : "dark");
});
const copyBtn = document.getElementById("copy-md");
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(mdSummary);
    copyBtn.textContent = "Copied Markdown!";
    setTimeout(() => { copyBtn.textContent = "Copy PR Summary"; }, 1800);
  } catch {
    copyBtn.textContent = "Copy Unavailable";
  }
});
const catPills = [...document.querySelectorAll(".pill[data-filter]")];
const statusPills = [...document.querySelectorAll(".pill[data-status-filter]")];
const sections = [...document.querySelectorAll("section.category[data-category]")];
const auditRows = [...document.querySelectorAll("details.audit-row")];
const searchInput = document.getElementById("audit-search");
let activeCat = "all";
let activeStatus = "all";
function applyFilters() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const hasRowFilter = activeStatus !== "all" || q.length > 0;
  for (const row of auditRows) {
    const statusOk = activeStatus === "all" || row.dataset.status === activeStatus;
    const textOk = !q || (row.dataset.search || "").includes(q);
    row.style.display = statusOk && textOk ? "" : "none";
  }
  for (const s of sections) {
    const catOk = activeCat === "all" || s.dataset.category === activeCat;
    const visibleRows = [...s.querySelectorAll("details.audit-row")].filter((r) => r.style.display !== "none").length;
    s.style.display = catOk && (!hasRowFilter || visibleRows > 0) ? "" : "none";
  }
}
for (const pill of catPills) {
  pill.addEventListener("click", () => {
    activeCat = pill.dataset.filter;
    for (const p of catPills) p.setAttribute("aria-pressed", String(p === pill));
    applyFilters();
  });
}
for (const pill of statusPills) {
  pill.addEventListener("click", () => {
    activeStatus = pill.dataset.statusFilter;
    for (const p of statusPills) p.setAttribute("aria-pressed", String(p === pill));
    applyFilters();
  });
}
searchInput.addEventListener("input", applyFilters);
</script>
</body>
</html>
`;
}

async function maybeUploadToCloudArtifacts(files) {
  const host = process.env.SMITHERS_ARTIFACTS_URL ?? "http://artifacts.smithers.internal";
  const uploaded = [];
  for (const { name, path } of files) {
    const body = readFileSync(path);
    try {
      const res = await fetch(`${host.replace(/\/$/, "")}/${name}`, {
        method: "PUT",
        headers: {
          "content-length": String(body.byteLength),
          "content-type": name.endsWith(".html") ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
        },
        body,
      });
      uploaded.push({ name, status: res.status, ok: res.ok });
    } catch (err) {
      uploaded.push({ name, status: 0, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return uploaded;
}

if (!skipUphill) {
  const run = runUphill();
  if (run.stdout.trim()) process.stdout.write(`${run.stdout.trim()}\n`);
  if (run.status !== 0) {
    process.stderr.write(run.stderr || "uphill exited with non-zero status\n");
    process.exit(run.status);
  }
}

const uphillJsonPath = join(root, ".uphill/report.json");
if (!existsSync(uphillJsonPath)) {
  process.stderr.write("Missing .uphill/report.json; run without --skip-uphill.\n");
  process.exit(1);
}

const rawUphill = JSON.parse(readFileSync(uphillJsonPath, "utf8"));
const normalized = normalizeUphillReport(rawUphill);
const trust = detectTrustPosture();
const wasm = collectWasmFootprint();
const revision = readRevInfo();
const generatedAt = new Date().toISOString();

const report = {
  schemaVersion: 1,
  repository: "evmts/voltaire",
  generatedAt,
  revision,
  trust,
  overall: normalized.overall,
  categories: normalized.categories,
  opportunities: normalized.opportunities,
  wasm,
};

mkdirSync(outDir, { recursive: true });
const jsonOut = join(outDir, "audit-report.json");
const htmlOut = join(outDir, "audit-report.html");
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(htmlOut, renderHtml(report), "utf8");

if (uploadArtifacts) {
  const uploads = await maybeUploadToCloudArtifacts([
    { name: "audit-report.json", path: jsonOut },
    { name: "audit-report.html", path: htmlOut },
  ]);
  process.stdout.write(`Cloud artifact uploads: ${JSON.stringify(uploads)}\n`);
}

const summary = report.categories.map((c) => `${c.id}=${c.score ?? "—"}`).join(" ");
process.stdout.write(`Lighthouse Audit Report [${trust.mode}]: overall=${report.overall ?? "—"} ${summary}\n`);
process.stdout.write(`Wrote ${jsonOut} (${statSync(jsonOut).size}B) and ${htmlOut} (${statSync(htmlOut).size}B)\n`);

if (strict) {
  const factoryCat = report.categories.find((c) => c.id === "factory-and-ci");
  if (!factoryCat || (factoryCat.score ?? 0) < 100) {
    process.stderr.write(`Strict gate failed: factory-and-ci score is ${factoryCat?.score ?? "missing"} (expected 100)\n`);
    process.exit(1);
  }
}
