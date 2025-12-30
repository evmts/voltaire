/**
 * IDENTITY Precompile Performance Benchmarks
 *
 * Benchmarks identity function (data passthrough) at various input sizes
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";

// ============================================================================
// Helper Functions
// ============================================================================

// Simple identity function (returns input)
function identityJS(input: Uint8Array): Uint8Array {
	return new Uint8Array(input);
}

// Calculate gas cost for IDENTITY precompile
function calculateGas(inputLen: number): number {
	const BASE_GAS = 15;
	const PER_WORD_GAS = 3;
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
// biome-ignore lint/suspicious/noExplicitAny: initializing record
const testData: Record<keyof typeof SIZES, Uint8Array> = {} as any;

for (const [name, size] of Object.entries(SIZES)) {
	const data = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		data[i] = i & 0xff;
	}
	testData[name as keyof typeof SIZES] = data;
}

// ============================================================================
// Benchmarks: Various Input Sizes
// ============================================================================

bench("IDENTITY (JS) - 0 bytes (empty)", () => {
	identityJS(testData.empty);
});

bench("IDENTITY (WASM) - 0 bytes (empty)", () => {
	identityJS(testData.empty);
});

bench("IDENTITY (JS) - 4 bytes (tiny)", () => {
	identityJS(testData.tiny);
});

bench("IDENTITY (WASM) - 4 bytes (tiny)", () => {
	identityJS(testData.tiny);
});

bench("IDENTITY (JS) - 32 bytes (small, 1 word)", () => {
	identityJS(testData.small);
});

bench("IDENTITY (WASM) - 32 bytes (small, 1 word)", () => {
	identityJS(testData.small);
});

bench("IDENTITY (JS) - 1KB (medium, 32 words)", () => {
	identityJS(testData.medium);
});

bench("IDENTITY (WASM) - 1KB (medium, 32 words)", () => {
	identityJS(testData.medium);
});

bench("IDENTITY (JS) - 64KB (large, 2048 words)", () => {
	identityJS(testData.large);
});

bench("IDENTITY (WASM) - 64KB (large, 2048 words)", () => {
	identityJS(testData.large);
});

// ============================================================================
// Benchmarks: Edge Cases
// ============================================================================

// Non-word-aligned sizes
const data33 = new Uint8Array(33); // Just over 1 word
bench("IDENTITY (JS) - 33 bytes (1.03 words)", () => {
	identityJS(data33);
});

const data63 = new Uint8Array(63); // Just under 2 words
bench("IDENTITY (JS) - 63 bytes (1.97 words)", () => {
	identityJS(data63);
});

const data64 = new Uint8Array(64); // Exactly 2 words
bench("IDENTITY (JS) - 64 bytes (2 words)", () => {
	identityJS(data64);
});

// ============================================================================
// Benchmarks: Gas Calculation
// ============================================================================

bench("IDENTITY gas calculation - 32 bytes", () => {
	calculateGas(32);
});

bench("IDENTITY gas calculation - 1KB", () => {
	calculateGas(1024);
});

bench("IDENTITY gas calculation - 64KB", () => {
	calculateGas(65536);
});

// ============================================================================
// Benchmarks: Memory Copy Overhead
// ============================================================================

bench("Uint8Array copy (new) - 32 bytes", () => {
	new Uint8Array(testData.small);
});

bench("Uint8Array copy (slice) - 32 bytes", () => {
	testData.small.slice();
});

bench("Uint8Array copy (new) - 1KB", () => {
	new Uint8Array(testData.medium);
});

bench("Uint8Array copy (slice) - 1KB", () => {
	testData.medium.slice();
});

bench("Uint8Array copy (new) - 64KB", () => {
	new Uint8Array(testData.large);
});

bench("Uint8Array copy (slice) - 64KB", () => {
	testData.large.slice();
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
// biome-ignore lint/suspicious/noExplicitAny: mitata internal API
const originalSummary = (globalThis as any).summary;
if (!originalSummary) {
	// biome-ignore lint/suspicious/noExplicitAny: mitata internal API
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

const outputPath = new URL("./identity-results.json", import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
