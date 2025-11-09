/**
 * SHA256 Performance Benchmarks
 *
 * Measures SHA256 hashing performance at different input sizes.
 * Compares Noble.js and WASM implementations.
 * Exports results to JSON for analysis.
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import * as loader from "../wasm-loader/loader.js";
import { SHA256 } from "./SHA256/index.js";
import { Sha256Wasm } from "./sha256.wasm.js";

// Load WASM module before benchmarking
await loader.loadWasm(new URL("../../wasm/primitives.wasm", import.meta.url));

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

bench("SHA256 (Noble): 4 bytes (tiny)", () => {
	SHA256.hash(testData.tiny);
});

bench("SHA256 (WASM): 4 bytes (tiny)", () => {
	Sha256Wasm.hash(testData.tiny);
});

bench("SHA256 (Noble): 32 bytes (small)", () => {
	SHA256.hash(testData.small);
});

bench("SHA256 (WASM): 32 bytes (small)", () => {
	Sha256Wasm.hash(testData.small);
});

bench("SHA256 (Noble): 256 bytes (medium)", () => {
	SHA256.hash(testData.medium);
});

bench("SHA256 (WASM): 256 bytes (medium)", () => {
	Sha256Wasm.hash(testData.medium);
});

bench("SHA256 (Noble): 1 KB (large)", () => {
	SHA256.hash(testData.large);
});

bench("SHA256 (WASM): 1 KB (large)", () => {
	Sha256Wasm.hash(testData.large);
});

bench("SHA256 (Noble): 64 KB (xlarge)", () => {
	SHA256.hash(testData.xlarge);
});

bench("SHA256 (WASM): 64 KB (xlarge)", () => {
	Sha256Wasm.hash(testData.xlarge);
});

bench("SHA256 (Noble): 1 MB (huge)", () => {
	SHA256.hash(testData.huge);
});

bench("SHA256 (WASM): 1 MB (huge)", () => {
	Sha256Wasm.hash(testData.huge);
});

bench("SHA256 (Noble).hashString: small text", () => {
	SHA256.hashString("hello world");
});

bench("SHA256 (WASM).hashString: small text", () => {
	Sha256Wasm.hashString("hello world");
});

bench("SHA256 (Noble).hashString: medium text", () => {
	SHA256.hashString("The quick brown fox jumps over the lazy dog. ".repeat(10));
});

bench("SHA256 (WASM).hashString: medium text", () => {
	Sha256Wasm.hashString(
		"The quick brown fox jumps over the lazy dog. ".repeat(10),
	);
});

bench("SHA256 (Noble).hashHex: small hex", () => {
	SHA256.hashHex("0xdeadbeef");
});

bench("SHA256 (WASM).hashHex: small hex", () => {
	Sha256Wasm.hashHex("0xdeadbeef");
});

bench("SHA256 (Noble).hashHex: 32-byte hex", () => {
	SHA256.hashHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	);
});

bench("SHA256 (WASM).hashHex: 32-byte hex", () => {
	Sha256Wasm.hashHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	);
});

bench("SHA256 (Noble).create (incremental): 1KB in 32-byte chunks", () => {
	const hasher = SHA256.create();
	for (let i = 0; i < 32; i++) {
		hasher.update(testData.small);
	}
	hasher.digest();
});

bench("SHA256 (WASM).create (incremental): 1KB in 32-byte chunks", () => {
	const hasher = Sha256Wasm.create();
	for (let i = 0; i < 32; i++) {
		hasher.update(testData.small);
	}
	hasher.digest();
});

bench("SHA256 (Noble).create (incremental): 1KB in single chunk", () => {
	const hasher = SHA256.create();
	hasher.update(testData.large);
	hasher.digest();
});

bench("SHA256 (WASM).create (incremental): 1KB in single chunk", () => {
	const hasher = Sha256Wasm.create();
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
			const sizeValue = sizeMatch[1];
			const unit = sizeMatch[2];
			if (sizeValue && unit) {
				const value = Number.parseFloat(sizeValue);
				const unitUpper = unit.toUpperCase();
				let bytes = value;

				if (unitUpper === "KB") bytes *= 1024;
				if (unitUpper === "MB") bytes *= 1024 * 1024;

				throughput = (bytes * result.ops) / (1024 * 1024);
			}
		}

		results.push({
			name: result.name,
			ops_per_sec: result.ops,
			avg_time_ns: result.avg * 1_000_000,
			min_time_ns: result.min * 1_000_000,
			max_time_ns: result.max * 1_000_000,
			throughput_mb_per_sec: throughput ?? 0,
		});
	};
}

await run({
	// units: false,
	// silent: false,
	throw: false,
	colors: true,
	// percentiles: false,
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
		fastest:
			results.length > 0
				? results.reduce((a, b) => (a.ops_per_sec > b.ops_per_sec ? a : b))
				: null,
		slowest:
			results.length > 0
				? results.reduce((a, b) => (a.ops_per_sec < b.ops_per_sec ? a : b))
				: null,
	},
};

const outputPath = new URL("./sha256-results.json", import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
if (output.summary.fastest) {
}
if (output.summary.slowest) {
}
