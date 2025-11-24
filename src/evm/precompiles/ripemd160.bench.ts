/**
 * RIPEMD160 Precompile Performance Benchmarks
 *
 * Benchmarks RIPEMD160 precompile (0x03) at various input sizes
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import { RIPEMD160 } from "../../crypto/RIPEMD160/index.js";
import * as loader from "../../wasm-loader/loader.js";

// Load WASM module before benchmarking
await loader.loadWasm(
	new URL("../../../wasm/primitives.wasm", import.meta.url),
);

// ============================================================================
// Helper Functions
// ============================================================================

// Calculate gas cost for RIPEMD160 precompile
function calculateGas(inputLen: number): number {
	const BASE_GAS = 600;
	const PER_WORD_GAS = 120;
	const numWords = Math.floor((inputLen + 31) / 32);
	return BASE_GAS + PER_WORD_GAS * numWords;
}

// ============================================================================
// Test Data
// ============================================================================

const SIZES = {
	empty: 0,
	tiny: 4,
	small: 32, // 1 word
	medium: 1024, // 32 words (1KB)
	large: 65536, // 2048 words (64KB)
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
// Benchmarks: Various Input Sizes (JS)
// ============================================================================

bench("RIPEMD160 (JS) - 0 bytes (empty)", () => {
	RIPEMD160.hash(testData.empty);
});

bench("RIPEMD160 (WASM) - 0 bytes (empty)", () => {
	loader.ripemd160(testData.empty);
});

bench("RIPEMD160 (JS) - 4 bytes (tiny)", () => {
	RIPEMD160.hash(testData.tiny);
});

bench("RIPEMD160 (WASM) - 4 bytes (tiny)", () => {
	loader.ripemd160(testData.tiny);
});

bench("RIPEMD160 (JS) - 32 bytes (small, 1 word)", () => {
	RIPEMD160.hash(testData.small);
});

bench("RIPEMD160 (WASM) - 32 bytes (small, 1 word)", () => {
	loader.ripemd160(testData.small);
});

bench("RIPEMD160 (JS) - 1KB (medium, 32 words)", () => {
	RIPEMD160.hash(testData.medium);
});

bench("RIPEMD160 (WASM) - 1KB (medium, 32 words)", () => {
	loader.ripemd160(testData.medium);
});

bench("RIPEMD160 (JS) - 64KB (large, 2048 words)", () => {
	RIPEMD160.hash(testData.large);
});

bench("RIPEMD160 (WASM) - 64KB (large, 2048 words)", () => {
	loader.ripemd160(testData.large);
});

// ============================================================================
// Benchmarks: Edge Cases
// ============================================================================

// Non-word-aligned sizes
const data33 = new Uint8Array(33);
bench("RIPEMD160 (JS) - 33 bytes (1.03 words)", () => {
	RIPEMD160.hash(data33);
});

bench("RIPEMD160 (WASM) - 33 bytes (1.03 words)", () => {
	loader.ripemd160(data33);
});

const data63 = new Uint8Array(63);
bench("RIPEMD160 (JS) - 63 bytes (1.97 words)", () => {
	RIPEMD160.hash(data63);
});

bench("RIPEMD160 (WASM) - 63 bytes (1.97 words)", () => {
	loader.ripemd160(data63);
});

const data64 = new Uint8Array(64);
bench("RIPEMD160 (JS) - 64 bytes (2 words)", () => {
	RIPEMD160.hash(data64);
});

bench("RIPEMD160 (WASM) - 64 bytes (2 words)", () => {
	loader.ripemd160(data64);
});

// ============================================================================
// Benchmarks: String Hashing
// ============================================================================

const shortString = "hello world";
const mediumString = "The quick brown fox jumps over the lazy dog. ".repeat(10);
const longString = mediumString.repeat(100);

bench("RIPEMD160 (JS) hashString - short", () => {
	RIPEMD160.hashString(shortString);
});

bench("RIPEMD160 (JS) hashString - medium", () => {
	RIPEMD160.hashString(mediumString);
});

bench("RIPEMD160 (JS) hashString - long", () => {
	RIPEMD160.hashString(longString);
});

// ============================================================================
// Benchmarks: Hex Input
// ============================================================================

const shortHex = "0xdeadbeef";
const mediumHex = `0x${"ab".repeat(512)}`;
const longHex = `0x${"cd".repeat(32768)}`;

bench("RIPEMD160 (JS) hashHex - short", () => {
	RIPEMD160.hashHex(shortHex);
});

bench("RIPEMD160 (JS) hashHex - medium", () => {
	RIPEMD160.hashHex(mediumHex);
});

bench("RIPEMD160 (JS) hashHex - long", () => {
	RIPEMD160.hashHex(longHex);
});

// ============================================================================
// Benchmarks: Incremental Hashing
// ============================================================================

bench("RIPEMD160 (JS) incremental - 1KB in 32-byte chunks", () => {
	const hasher = RIPEMD160.create();
	for (let i = 0; i < 32; i++) {
		hasher.update(testData.small);
	}
	hasher.digest();
});

bench("RIPEMD160 (JS) incremental - 1KB in single chunk", () => {
	const hasher = RIPEMD160.create();
	hasher.update(testData.medium);
	hasher.digest();
});

// ============================================================================
// Benchmarks: Gas Calculation
// ============================================================================

bench("RIPEMD160 gas calculation - 32 bytes", () => {
	calculateGas(32);
});

bench("RIPEMD160 gas calculation - 1KB", () => {
	calculateGas(1024);
});

bench("RIPEMD160 gas calculation - 64KB", () => {
	calculateGas(65536);
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
		// Calculate throughput for size-related benchmarks
		const sizeMatch = result.name.match(/(\d+)\s*(bytes|KB|MB)/i);
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
	throw: false,
	colors: true,
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

const outputPath = new URL(
	"./ripemd160-precompile-results.json",
	import.meta.url,
).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
