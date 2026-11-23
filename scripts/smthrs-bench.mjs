#!/usr/bin/env node
/**
 * Unified Smithers benchmark runner adapter for Voltaire.
 *
 * Runs native benchmark suites across TypeScript/Bun (mitata), Zig (zbench),
 * Rust (cargo), Go (`go test -bench`), C, Python, Swift, and Effect, and emits
 * a canonical `SMTHRS_BENCH_JSON:` structured report so `smithers-build bench`
 * and `smithers-build affected bench` can cache, summarize, and diff every
 * benchmark across changes.
 *
 * Usage:
 *   node scripts/smthrs-bench.mjs --kind <ts|zig|rust|go|c|py|swift|effect> --suite <name> <target...>
 */

import { spawnSync } from "node:child_process"
import * as Fs from "node:fs"
import * as Os from "node:os"
import * as Path from "node:path"

const REPORT_PREFIX = "SMTHRS_BENCH_JSON:"
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]/g

const stripAnsi = (text) => text.replace(ANSI_RE, "")

const toNs = (value, unit) => {
  const n = Number(value)
  switch (unit) {
    case "ps":
      return n / 1_000
    case "ns":
      return n
    case "µs":
    case "us":
      return n * 1_000
    case "ms":
      return n * 1_000_000
    case "s":
      return n * 1_000_000_000
    default:
      return n
  }
}

const extractExistingJson = (stdout) => {
  const lines = stdout.split(/\r?\n/)
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith(REPORT_PREFIX)) {
      return JSON.parse(trimmed.slice(REPORT_PREFIX.length).trim())
    }
  }
  return undefined
}

const parseMitata = (rawStdout) => {
  const lines = stripAnsi(rawStdout).split(/\r?\n/)
  const metrics = []
  const rowRe = /^(.+?)\s+([\d.]+)\s*(ps|ns|µs|us|ms|s)\/iter(?:\s+([\d.]+)\s*(ps|ns|µs|us|ms|s))?/
  const rangeRe = /^\(\s*([\d.]+)\s*(ps|ns|µs|us|ms|s)\s*(?:…|\.\.\.)\s*([\d.]+)\s*(ps|ns|µs|us|ms|s)\s*\)(?:\s+([\d.]+)\s*(ps|ns|µs|us|ms|s))?/

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trimEnd()
    const match = rowRe.exec(line)
    if (!match) continue
    const name = match[1].trim()
    if (!name || name.startsWith("(") || name.startsWith("-") || name === "benchmark") continue
    const meanNs = toNs(match[2], match[3])
    const p75Ns = match[4] ? toNs(match[4], match[5]) : undefined
    let minNs
    let maxNs
    let p99Ns
    const nextLine = lines[i + 1]?.trim() ?? ""
    const range = rangeRe.exec(nextLine)
    if (range) {
      minNs = toNs(range[1], range[2])
      maxNs = toNs(range[3], range[4])
      p99Ns = range[5] ? toNs(range[5], range[6]) : undefined
    }
    const metric = {
      name,
      unit: "ns/op",
      value: Number(meanNs.toFixed(3)),
      lowerIsBetter: true,
      meanNs: Number(meanNs.toFixed(3)),
      ...(meanNs > 0 ? { opsPerSec: Math.round(1_000_000_000 / meanNs) } : {}),
      ...(minNs !== undefined ? { minNs: Number(minNs.toFixed(3)) } : {}),
      ...(maxNs !== undefined ? { maxNs: Number(maxNs.toFixed(3)) } : {}),
      ...(p75Ns !== undefined ? { p75Ns: Number(p75Ns.toFixed(3)) } : {}),
      ...(p99Ns !== undefined ? { p99Ns: Number(p99Ns.toFixed(3)) } : {})
    }
    metrics.push(metric)
  }
  return metrics
}

const parseZbench = (rawStdout) => {
  const lines = stripAnsi(rawStdout).split(/\r?\n/)
  const metrics = []
  // zbench columns:
  // benchmark   runs   total time   time/run (avg ± σ)   (min ... max)   p75   p99   p995
  const lineRe =
    /^(.+?)\s+(\d+)\s+([\d.]+)(ns|us|µs|ms|s)\s+([\d.]+)(ns|us|µs|ms|s)\s+±\s+([\d.]+)(?:ns|us|µs|ms|s|%)\s+\(([\d.]+)(ns|us|µs|ms|s)\s+\.\.\.\s+([\d.]+)(ns|us|µs|ms|s)\)\s+([\d.]+)(ns|us|µs|ms|s)\s+([\d.]+)(ns|us|µs|ms|s)/
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith("benchmark") || line.startsWith("---")) continue
    const match = lineRe.exec(line)
    if (!match) continue
    const name = match[1].trim()
    const samples = Number(match[2])
    const meanNs = toNs(match[5], match[6])
    const rme = Number(match[7])
    const minNs = toNs(match[8], match[9])
    const maxNs = toNs(match[10], match[11])
    const p75Ns = toNs(match[12], match[13])
    const p99Ns = toNs(match[14], match[15])
    metrics.push({
      name,
      unit: "ns/op",
      value: Number(meanNs.toFixed(3)),
      lowerIsBetter: true,
      meanNs: Number(meanNs.toFixed(3)),
      ...(meanNs > 0 ? { opsPerSec: Math.round(1_000_000_000 / meanNs) } : {}),
      minNs: Number(minNs.toFixed(3)),
      maxNs: Number(maxNs.toFixed(3)),
      p75Ns: Number(p75Ns.toFixed(3)),
      p99Ns: Number(p99Ns.toFixed(3)),
      rme,
      samples
    })
  }
  return metrics
}

const parseGoBench = (rawStdout) => {
  const lines = stripAnsi(rawStdout).split(/\r?\n/)
  const metrics = []
  const re = /^(Benchmark\S+?)(?:-\d+)?\s+(\d+)\s+([\d.]+)\s+ns\/op/
  for (const line of lines) {
    const match = re.exec(line.trim())
    if (!match) continue
    const name = match[1]
    const samples = Number(match[2])
    const meanNs = Number(match[3])
    metrics.push({
      name,
      unit: "ns/op",
      value: Number(meanNs.toFixed(3)),
      lowerIsBetter: true,
      meanNs: Number(meanNs.toFixed(3)),
      ...(meanNs > 0 ? { opsPerSec: Math.round(1_000_000_000 / meanNs) } : {}),
      samples
    })
  }
  return metrics
}

const parseArgs = (argv) => {
  let kind
  let suite
  let cwd = process.cwd()
  const rest = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--kind") kind = argv[++i]
    else if (arg === "--suite") suite = argv[++i]
    else if (arg === "--cwd") cwd = Path.resolve(argv[++i])
    else rest.push(arg)
  }
  return { kind, suite, cwd, rest }
}

const runCmd = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options
  })
  if (result.error) {
    process.stderr.write(`Failed to spawn ${command}: ${result.error.message}\n`)
    process.exit(1)
  }
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }
  return result
}

const main = () => {
  const { kind, suite, cwd, rest } = parseArgs(process.argv.slice(2))
  if (!kind || rest.length === 0) {
    process.stderr.write(
      "Usage: smthrs-bench.mjs --kind <ts|zig|rust|go|c|py|swift|effect> [--suite <name>] [--cwd <dir>] <target...>\n"
    )
    process.exit(2)
  }

  let runtime = kind
  let metrics = []
  let passthrough

  if (kind === "ts" || kind === "effect") {
    runtime = "bun"
    const res = runCmd("bun", ["run", ...rest], { cwd })
    process.stdout.write(res.stdout)
    passthrough = extractExistingJson(res.stdout)
    if (!passthrough) metrics = parseMitata(res.stdout)
  } else if (kind === "zig") {
    runtime = "zig"
    const filter = rest[0]
    const res = runCmd(
      "zig",
      ["build", "bench", "-Dwith-benches=true", "-Doptimize=ReleaseFast", `-Dfilter=${filter}`],
      { cwd }
    )
    const combined = `${res.stdout}\n${res.stderr}`
    process.stdout.write(res.stdout)
    passthrough = extractExistingJson(combined)
    if (!passthrough) metrics = parseZbench(combined)
  } else if (kind === "go") {
    runtime = "go"
    const pkg = rest[0]
    const res = runCmd("go", ["test", "-run=^$", "-bench=.", "-benchmem", "-benchtime=150ms", pkg], { cwd })
    process.stdout.write(res.stdout)
    metrics = parseGoBench(res.stdout)
  } else if (kind === "rust") {
    runtime = "rust"
    const res = runCmd("cargo", ["test", "--release", ...rest, "--", "--nocapture"], { cwd })
    process.stdout.write(res.stdout)
    passthrough = extractExistingJson(res.stdout)
  } else if (kind === "c") {
    runtime = "c"
    const src = Path.resolve(cwd, rest[0])
    const extraFlags = rest.slice(1)
    const tmpBin = Path.join(Os.tmpdir(), `voltaire-c-bench-${process.pid}-${Date.now()}`)
    try {
      runCmd("cc", ["-O3", src, ...extraFlags, "-o", tmpBin], { cwd })
      const res = runCmd(tmpBin, [], { cwd })
      process.stdout.write(res.stdout)
      passthrough = extractExistingJson(res.stdout)
    } finally {
      try {
        Fs.unlinkSync(tmpBin)
      } catch {
        // ignore
      }
    }
  } else if (kind === "py") {
    runtime = "python3"
    const res = runCmd("python3", rest, {
      cwd,
      env: { ...process.env, PYTHONPATH: Path.join(cwd, "packages/voltaire-py/src") }
    })
    process.stdout.write(res.stdout)
    passthrough = extractExistingJson(res.stdout)
  } else if (kind === "swift") {
    runtime = "swift"
    const res = runCmd("swift", ["run", "-c", "release", ...rest], { cwd })
    process.stdout.write(res.stdout)
    passthrough = extractExistingJson(res.stdout)
  } else {
    process.stderr.write(`Unknown benchmark kind: ${kind}\n`)
    process.exit(2)
  }

  const report = passthrough ?? {
    suite: suite ?? rest[0],
    runtime,
    metrics
  }
  if (!Array.isArray(report.metrics) || report.metrics.length === 0) {
    process.stderr.write(`Warning: no structured benchmark metrics captured for ${suite ?? rest[0]}\n`)
  }
  process.stdout.write(`\n${REPORT_PREFIX}${JSON.stringify(report)}\n`)
}

main()
