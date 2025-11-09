/**
 * Hex Performance Benchmarks
 *
 * Measures performance of hex operations
 */

import type { BrandedHex } from "./BrandedHex/BrandedHex.js";
import {
	assertSize,
	concat,
	equals,
	fromBigInt,
	fromBoolean,
	fromBytes,
	fromNumber,
	fromString,
	isHex,
	isSized,
	pad,
	padRight,
	random,
	size,
	slice,
	toBigInt,
	toBoolean,
	toBytes,
	toNumber,
	toString,
	trim,
	validate,
	xor,
	zero,
} from "./BrandedHex/index.js";

// Benchmark runner
interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		try {
			fn();
		} catch {
			// Ignore errors during warmup
		}
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		try {
			fn();
		} catch {
			// Count iteration even if it throws
		}
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data
// ============================================================================

// Small data (4 bytes)
const smallHex: BrandedHex = "0x12345678" as BrandedHex;
const smallBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

// Medium data (32 bytes)
const mediumHex: BrandedHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as BrandedHex;
const mediumBytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) mediumBytes[i] = i;

// Large data (256 bytes)
let largeHexStr = "0x";
for (let i = 0; i < 256; i++) {
	largeHexStr += (i % 256).toString(16).padStart(2, "0");
}
const largeHex: BrandedHex = largeHexStr as BrandedHex;
const largeBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) largeBytes[i] = i % 256;

// Test strings
const testString = "hello world";
const longString = "hello world ".repeat(10);

// Invalid hex strings
const invalidNoPrefix = "1234";
const invalidChars = "0xZZZZ";

const results: BenchmarkResult[] = [];
results.push(benchmark("isHex - valid small", () => isHex(smallHex)));
results.push(benchmark("isHex - valid large", () => isHex(largeHex)));
results.push(
	benchmark("isHex - invalid (no prefix)", () => isHex(invalidNoPrefix)),
);
results.push(
	benchmark("isHex - invalid (bad chars)", () => isHex(invalidChars)),
);
results.push(
	benchmark("isSized - correct size (4)", () => isSized(smallHex, 4)),
);
results.push(benchmark("isSized - wrong size", () => isSized(smallHex, 8)));
results.push(benchmark("isSized - large (256)", () => isSized(largeHex, 256)));
results.push(benchmark("validate - valid small", () => validate(smallHex)));
results.push(benchmark("validate - valid large", () => validate(largeHex)));
results.push(
	benchmark("validate - invalid (no prefix)", () => {
		try {
			validate(invalidNoPrefix);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid (bad chars)", () => {
		try {
			validate(invalidChars);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("assertSize - correct size", () => assertSize(smallHex, 4)),
);
results.push(
	benchmark("assertSize - wrong size", () => {
		try {
			assertSize(smallHex, 8);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("fromBytes - small (4 bytes)", () => fromBytes(smallBytes)),
);
results.push(
	benchmark("fromBytes - medium (32 bytes)", () => fromBytes(mediumBytes)),
);
results.push(
	benchmark("fromBytes - large (256 bytes)", () => fromBytes(largeBytes)),
);
results.push(benchmark("toBytes - small (4 bytes)", () => toBytes(smallHex)));
results.push(
	benchmark("toBytes - medium (32 bytes)", () => toBytes(mediumHex)),
);
results.push(benchmark("toBytes - large (256 bytes)", () => toBytes(largeHex)));

const numSmall = 255;
const numMedium = 0x123456;
const numLarge = 0x7fffffff;
results.push(
	benchmark("fromNumber - small (no padding)", () => fromNumber(numSmall)),
);
results.push(
	benchmark("fromNumber - small (padded)", () => fromNumber(numSmall, 4)),
);
results.push(benchmark("fromNumber - medium", () => fromNumber(numMedium)));
results.push(benchmark("fromNumber - large", () => fromNumber(numLarge)));
const hexFromNum = fromNumber(0x123456);
results.push(
	benchmark("toNumber - small", () => toNumber("0xff" as BrandedHex)),
);
results.push(benchmark("toNumber - medium", () => toNumber(hexFromNum)));
results.push(benchmark("toNumber - large", () => toNumber(smallHex)));

const bigSmall = 255n;
const bigMedium = 0x123456789abcdefn;
const bigLarge = BigInt(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);
results.push(benchmark("fromBigInt - small", () => fromBigInt(bigSmall)));
results.push(
	benchmark("fromBigInt - small (padded)", () => fromBigInt(bigSmall, 32)),
);
results.push(benchmark("fromBigInt - medium", () => fromBigInt(bigMedium)));
results.push(
	benchmark("fromBigInt - large (256 bits)", () => fromBigInt(bigLarge)),
);
results.push(
	benchmark("toBigInt - small", () => toBigInt("0xff" as BrandedHex)),
);
results.push(benchmark("toBigInt - medium", () => toBigInt(mediumHex)));
results.push(benchmark("toBigInt - large", () => toBigInt(largeHex)));

const hexFromString = fromString(testString) as BrandedHex;
const hexFromLongString = fromString(longString) as BrandedHex;
results.push(benchmark("fromString - short", () => fromString(testString)));
results.push(benchmark("fromString - long", () => fromString(longString)));
results.push(benchmark("toString - short", () => toString(hexFromString)));
results.push(benchmark("toString - long", () => toString(hexFromLongString)));
results.push(benchmark("fromBoolean - true", () => fromBoolean(true)));
results.push(benchmark("fromBoolean - false", () => fromBoolean(false)));
results.push(
	benchmark("toBoolean - true (0x01)", () => toBoolean("0x01" as BrandedHex)),
);
results.push(
	benchmark("toBoolean - false (0x00)", () => toBoolean("0x00" as BrandedHex)),
);
results.push(
	benchmark("toBoolean - true (non-zero)", () =>
		toBoolean("0xff" as BrandedHex),
	),
);
results.push(benchmark("size - small (4 bytes)", () => size(smallHex)));
results.push(benchmark("size - medium (32 bytes)", () => size(mediumHex)));
results.push(benchmark("size - large (256 bytes)", () => size(largeHex)));
results.push(benchmark("concat - two small", () => concat(smallHex, smallHex)));
results.push(
	benchmark("concat - three small", () => concat(smallHex, smallHex, smallHex)),
);
results.push(
	benchmark("concat - two medium", () => concat(mediumHex, mediumHex)),
);
results.push(
	benchmark("concat - mixed sizes", () =>
		concat(smallHex, mediumHex, smallHex),
	),
);
results.push(benchmark("slice - small (start only)", () => slice(smallHex, 1)));
results.push(
	benchmark("slice - small (start + end)", () => slice(smallHex, 1, 3)),
);
results.push(benchmark("slice - medium", () => slice(mediumHex, 8, 24)));
results.push(benchmark("slice - large", () => slice(largeHex, 64, 192)));
results.push(benchmark("pad - small to medium", () => pad(smallHex, 32)));
results.push(benchmark("pad - small to large", () => pad(smallHex, 256)));
results.push(benchmark("pad - no-op (already sized)", () => pad(smallHex, 4)));
results.push(
	benchmark("padRight - small to medium", () => padRight(smallHex, 32)),
);
results.push(
	benchmark("padRight - small to large", () => padRight(smallHex, 256)),
);
results.push(
	benchmark("padRight - no-op (already sized)", () => padRight(smallHex, 4)),
);

const paddedSmall = pad(smallHex, 32);
const paddedMedium = pad(mediumHex, 256);
results.push(benchmark("trim - no leading zeros", () => trim(smallHex)));
results.push(benchmark("trim - padded small", () => trim(paddedSmall)));
results.push(benchmark("trim - padded medium", () => trim(paddedMedium)));
results.push(benchmark("trim - all zeros", () => trim(zero(32))));

const hexUpper: BrandedHex = "0xABCDEF" as BrandedHex;
const hexLower: BrandedHex = "0xabcdef" as BrandedHex;
const hexDifferent: BrandedHex = "0x123456" as BrandedHex;
results.push(
	benchmark("equals - same (exact)", () => equals(smallHex, smallHex)),
);
results.push(
	benchmark("equals - same (case diff)", () => equals(hexUpper, hexLower)),
);
results.push(
	benchmark("equals - different", () => equals(hexUpper, hexDifferent)),
);
results.push(benchmark("equals - large", () => equals(largeHex, largeHex)));

const xorA: BrandedHex = "0x12345678" as BrandedHex;
const xorB: BrandedHex = "0xabcdef01" as BrandedHex;
const xorMediumA = mediumHex;
const xorMediumB = random(32) as BrandedHex;
results.push(benchmark("xor - small (4 bytes)", () => xor(xorA, xorB)));
results.push(
	benchmark("xor - medium (32 bytes)", () => xor(xorMediumA, xorMediumB)),
);
results.push(
	benchmark("xor - large (256 bytes)", () => xor(largeHex, random(256))),
);
results.push(
	benchmark("xor - length mismatch", () => {
		try {
			xor(smallHex, mediumHex);
		} catch {
			// Expected
		}
	}),
);
results.push(benchmark("random - small (4 bytes)", () => random(4)));
results.push(benchmark("random - medium (32 bytes)", () => random(32)));
results.push(benchmark("random - large (256 bytes)", () => random(256)));
results.push(benchmark("zero - small (4 bytes)", () => zero(4)));
results.push(benchmark("zero - medium (32 bytes)", () => zero(32)));
results.push(benchmark("zero - large (256 bytes)", () => zero(256)));

// Sort results (currently unused)
[...results].sort((a, b) => b.opsPerSec - a.opsPerSec);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/hex-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
