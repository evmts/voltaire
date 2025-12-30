/**
 * MODEXP Precompile Performance Benchmarks
 *
 * Benchmarks modular exponentiation at various sizes
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";

// ============================================================================
// Helper Functions
// ============================================================================

// Encode length as 32-byte big-endian
function encodeLength(len: number): Uint8Array {
	const bytes = new Uint8Array(32);
	const view = new DataView(bytes.buffer);
	view.setBigUint64(24, BigInt(len), false); // big-endian
	return bytes;
}

// Create MODEXP input format: [base_len, exp_len, mod_len, base, exp, mod]
function createModexpInput(
	base: Uint8Array,
	exp: Uint8Array,
	mod: Uint8Array,
): Uint8Array {
	const input = new Uint8Array(96 + base.length + exp.length + mod.length);
	input.set(encodeLength(base.length), 0);
	input.set(encodeLength(exp.length), 32);
	input.set(encodeLength(mod.length), 64);
	input.set(base, 96);
	input.set(exp, 96 + base.length);
	input.set(mod, 96 + base.length + exp.length);
	return input;
}

// Simple modular exponentiation using BigInt
function modexpJS(
	base: Uint8Array,
	exp: Uint8Array,
	mod: Uint8Array,
): Uint8Array {
	// Convert bytes to BigInt
	let baseBig = 0n;
	for (const byte of base) {
		baseBig = (baseBig << 8n) | BigInt(byte);
	}

	let expBig = 0n;
	for (const byte of exp) {
		expBig = (expBig << 8n) | BigInt(byte);
	}

	let modBig = 0n;
	for (const byte of mod) {
		modBig = (modBig << 8n) | BigInt(byte);
	}

	if (modBig === 0n) {
		return new Uint8Array(mod.length);
	}

	// Compute base^exp mod modulus
	let result = 1n;
	baseBig = baseBig % modBig;

	while (expBig > 0n) {
		if (expBig % 2n === 1n) {
			result = (result * baseBig) % modBig;
		}
		expBig = expBig >> 1n;
		baseBig = (baseBig * baseBig) % modBig;
	}

	// Convert result back to bytes
	const resultBytes = new Uint8Array(mod.length);
	for (let i = mod.length - 1; i >= 0; i--) {
		resultBytes[i] = Number(result & 0xffn);
		result = result >> 8n;
	}

	return resultBytes;
}

// ============================================================================
// Test Data
// ============================================================================

// Small exponent (2^8 mod 997)
const smallBase = new Uint8Array([2]);
const smallExp = new Uint8Array([8]);
const smallMod = new Uint8Array([0x03, 0xe5]); // 997

// Medium exponent (2^256 mod large_prime)
const mediumBase = new Uint8Array([2]);
const mediumExp = new Uint8Array(32);
mediumExp[31] = 1; // 256
const mediumMod = new Uint8Array(32);
mediumMod[0] = 0xff;
mediumMod[31] = 0xc5;

// Large RSA-2048 size
const largeBase = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
	largeBase[i] = i & 0xff;
}
const largeExp = new Uint8Array(256);
largeExp[255] = 3; // 65537 (common RSA exponent)
largeExp[254] = 1;
const largeMod = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
	largeMod[i] = (256 - i) & 0xff;
}

// Very small (single byte operations)
const tinyBase = new Uint8Array([5]);
const tinyExp = new Uint8Array([3]);
const tinyMod = new Uint8Array([13]);

// ============================================================================
// Benchmarks: Small Exponents
// ============================================================================

bench("MODEXP (JS) - tiny (5^3 mod 13)", () => {
	modexpJS(tinyBase, tinyExp, tinyMod);
});

bench("MODEXP (JS) - small (2^8 mod 997)", () => {
	modexpJS(smallBase, smallExp, smallMod);
});

// ============================================================================
// Benchmarks: Medium Exponents
// ============================================================================

bench("MODEXP (JS) - medium (2^256 mod prime)", () => {
	modexpJS(mediumBase, mediumExp, mediumMod);
});

// ============================================================================
// Benchmarks: Large RSA-2048 Size
// ============================================================================

bench("MODEXP (JS) - large RSA-2048 (256 bytes)", () => {
	modexpJS(largeBase, largeExp, largeMod);
});

// ============================================================================
// Benchmarks: Input Encoding
// ============================================================================

bench("MODEXP encode input - small", () => {
	createModexpInput(smallBase, smallExp, smallMod);
});

bench("MODEXP encode input - medium", () => {
	createModexpInput(mediumBase, mediumExp, mediumMod);
});

bench("MODEXP encode input - large", () => {
	createModexpInput(largeBase, largeExp, largeMod);
});

// ============================================================================
// Benchmarks: Edge Cases
// ============================================================================

// Zero exponent (always returns 1)
const zeroExp = new Uint8Array([0]);
bench("MODEXP (JS) - zero exponent", () => {
	modexpJS(smallBase, zeroExp, smallMod);
});

// Exponent = 1 (returns base mod modulus)
const oneExp = new Uint8Array([1]);
bench("MODEXP (JS) - exponent = 1", () => {
	modexpJS(smallBase, oneExp, smallMod);
});

// Large base, small exponent
const largeBaseSmallExp = new Uint8Array(128);
largeBaseSmallExp.fill(0xff);
bench("MODEXP (JS) - large base (128 bytes), small exp", () => {
	modexpJS(largeBaseSmallExp, smallExp, largeMod);
});

// Small base, large exponent
const largeExpSmallBase = new Uint8Array(128);
largeExpSmallBase.fill(0xff);
bench("MODEXP (JS) - small base, large exp (128 bytes)", () => {
	modexpJS(smallBase, largeExpSmallBase, largeMod);
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
}

const results: BenchResult[] = [];

// Monkey patch mitata's summary to capture results
// biome-ignore lint/suspicious/noExplicitAny: mitata internal API
const originalSummary = (globalThis as any).summary;
if (!originalSummary) {
	// biome-ignore lint/suspicious/noExplicitAny: mitata internal API
	(globalThis as any).summary = (result: any) => {
		results.push({
			name: result.name,
			ops_per_sec: result.ops,
			avg_time_ns: result.avg * 1_000_000,
			min_time_ns: result.min * 1_000_000,
			max_time_ns: result.max * 1_000_000,
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

const outputPath = new URL("./modexp-results.json", import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
