/**
 * SHA256 Performance Benchmarks
 *
 * Measures SHA256 hashing performance at different input sizes.
 * Exports results to JSON for analysis.
 */

import { bench, run } from "mitata";
import { writeFileSync } from "node:fs";
import { Sha256 } from "./sha256.js";

// ============================================================================
// Benchmark Configuration
// ============================================================================

const SIZES = {
  tiny: 4, // 4 bytes
  small: 32, // 32 bytes
  medium: 256, // 256 bytes
  large: 1024, // 1 KB
  xlarge: 65536, // 64 KB
  huge: 1048576, // 1 MB
} as const;

// Pre-generate test data
const testData: Record<keyof typeof SIZES, Uint8Array> = {} as any;

for (const [name, size] of Object.entries(SIZES)) {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = i & 0xff;
  }
  testData[name as keyof typeof SIZES] = data;
}

// ============================================================================
// Benchmarks
// ============================================================================

bench("SHA256: 4 bytes (tiny)", () => {
  Sha256.hash(testData.tiny);
});

bench("SHA256: 32 bytes (small)", () => {
  Sha256.hash(testData.small);
});

bench("SHA256: 256 bytes (medium)", () => {
  Sha256.hash(testData.medium);
});

bench("SHA256: 1 KB (large)", () => {
  Sha256.hash(testData.large);
});

bench("SHA256: 64 KB (xlarge)", () => {
  Sha256.hash(testData.xlarge);
});

bench("SHA256: 1 MB (huge)", () => {
  Sha256.hash(testData.huge);
});

bench("SHA256.hashString: small text", () => {
  Sha256.hashString("hello world");
});

bench("SHA256.hashString: medium text", () => {
  Sha256.hashString(
    "The quick brown fox jumps over the lazy dog. ".repeat(10),
  );
});

bench("SHA256.hashHex: small hex", () => {
  Sha256.hashHex("0xdeadbeef");
});

bench("SHA256.hashHex: 32-byte hex", () => {
  Sha256.hashHex(
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  );
});

bench("SHA256.create (incremental): 1KB in 32-byte chunks", () => {
  const hasher = Sha256.create();
  for (let i = 0; i < 32; i++) {
    hasher.update(testData.small);
  }
  hasher.digest();
});

bench("SHA256.create (incremental): 1KB in single chunk", () => {
  const hasher = Sha256.create();
  hasher.update(testData.large);
  hasher.digest();
});

// ============================================================================
// Run and Export Results
// ============================================================================

interface BenchResult {
  name: string;
  ops_per_sec: number;
  avg_time_ns: number;
  min_time_ns: number;
  max_time_ns: number;
  throughput_mb_per_sec?: number;
}

const results: BenchResult[] = [];

// Monkey patch mitata's summary to capture results
const originalSummary = (globalThis as any).summary;
if (!originalSummary) {
  (globalThis as any).summary = (result: any) => {
    const sizeMatch = result.name.match(/(\d+(?:\.\d+)?)\s*(bytes|KB|MB)/i);
    let throughput: number | undefined;

    if (sizeMatch) {
      const value = Number.parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      let bytes = value;

      if (unit === "KB") bytes *= 1024;
      if (unit === "MB") bytes *= 1024 * 1024;

      throughput = (bytes * result.ops) / (1024 * 1024);
    }

    results.push({
      name: result.name,
      ops_per_sec: result.ops,
      avg_time_ns: result.avg * 1_000_000,
      min_time_ns: result.min * 1_000_000,
      max_time_ns: result.max * 1_000_000,
      throughput_mb_per_sec: throughput,
    });
  };
}

await run({
  units: false,
  silent: false,
  avg: true,
  json: false,
  colors: true,
  min_max: true,
  collect: false,
  percentiles: false,
});

// Export results
const output = {
  timestamp: new Date().toISOString(),
  runtime: "bun",
  version: process.version,
  platform: process.platform,
  arch: process.arch,
  results,
  summary: {
    total_benchmarks: results.length,
    fastest: results.length > 0 ? results.reduce((a, b) => (a.ops_per_sec > b.ops_per_sec ? a : b)) : null,
    slowest: results.length > 0 ? results.reduce((a, b) => (a.ops_per_sec < b.ops_per_sec ? a : b)) : null,
  },
};

const outputPath = new URL("./sha256-results.json", import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nResults exported to: ${outputPath}`);
console.log(`\nSummary:`);
console.log(`  Total benchmarks: ${output.summary.total_benchmarks}`);
if (output.summary.fastest) {
  console.log(`  Fastest: ${output.summary.fastest.name} (${output.summary.fastest.ops_per_sec.toFixed(0)} ops/sec)`);
}
if (output.summary.slowest) {
  console.log(`  Slowest: ${output.summary.slowest.name} (${output.summary.slowest.ops_per_sec.toFixed(0)} ops/sec)`);
}
