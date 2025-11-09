/**
 * Hash Performance Benchmarks
 *
 * Measures performance of Hash operations including creation,
 * conversion, comparison, validation, hashing, and utilities
 */

import { assert } from "./BrandedHash/assert.js";
import { clone } from "./BrandedHash/clone.js";
import { ZERO } from "./BrandedHash/constants.js";
import { equals } from "./BrandedHash/equals.js";
import { format } from "./BrandedHash/format.js";
import { fromBytes } from "./BrandedHash/fromBytes.js";
import { fromHex } from "./BrandedHash/fromHex.js";
import { isHash } from "./BrandedHash/isHash.js";
import { isValidHex } from "./BrandedHash/isValidHex.js";
import { isZero } from "./BrandedHash/isZero.js";
import { keccak256 } from "./BrandedHash/keccak256.js";
import { keccak256Hex } from "./BrandedHash/keccak256Hex.js";
import { keccak256String } from "./BrandedHash/keccak256String.js";
import { random } from "./BrandedHash/random.js";
import { slice } from "./BrandedHash/slice.js";
import { toBytes } from "./BrandedHash/toBytes.js";
import { toHex } from "./BrandedHash/toHex.js";
import { toString } from "./BrandedHash/toString.js";

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

const validHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const validHexNoPrefix =
	"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidHexShort = "0x1234";
const invalidHexBadChars =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg";

const validBytes = new Uint8Array(32);
validBytes.fill(1);

const invalidBytes = new Uint8Array(16);

const hash1 = fromHex(validHex);
const hash2 = fromHex(validHex);
const hash3 = fromBytes(validBytes);
const zeroHash = ZERO;

// Different data sizes for keccak256 benchmarks
const emptyData = new Uint8Array(0);
const smallData = new Uint8Array(32);
smallData.fill(1);
const mediumData = new Uint8Array(1024); // 1KB
mediumData.fill(2);
const largeData = new Uint8Array(10240); // 10KB
largeData.fill(3);

const results: BenchmarkResult[] = [];
results.push(benchmark("fromHex - with 0x prefix", () => fromHex(validHex)));
results.push(
	benchmark("fromHex - without prefix", () => fromHex(validHexNoPrefix)),
);
results.push(
	benchmark("fromHex - invalid length", () => {
		try {
			fromHex(invalidHexShort);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("fromHex - invalid chars", () => {
		try {
			fromHex(invalidHexBadChars);
		} catch {
			// Expected
		}
	}),
);
results.push(benchmark("fromBytes - valid", () => fromBytes(validBytes)));
results.push(
	benchmark("fromBytes - invalid length", () => {
		try {
			fromBytes(invalidBytes);
		} catch {
			// Expected
		}
	}),
);
results.push(benchmark("from - alias for fromHex", () => fromHex(validHex)));
results.push(benchmark("toHex", () => toHex(hash1)));
results.push(benchmark("toBytes", () => toBytes(hash1)));
results.push(benchmark("toString", () => toString(hash1)));
results.push(benchmark("equals - same value", () => equals(hash1, hash2)));
results.push(benchmark("equals - different value", () => equals(hash1, hash3)));
results.push(benchmark("equals - zero hash", () => equals(zeroHash, ZERO)));
results.push(benchmark("isZero - zero hash", () => isZero(zeroHash)));
results.push(benchmark("isZero - non-zero hash", () => isZero(hash1)));
results.push(benchmark("isHash - valid", () => isHash(hash1)));
results.push(benchmark("isHash - invalid (string)", () => isHash(validHex)));
results.push(
	benchmark("isHash - invalid (wrong length)", () => isHash(invalidBytes)),
);
results.push(benchmark("isHash - invalid (null)", () => isHash(null)));
results.push(
	benchmark("isValidHex - valid with prefix", () => isValidHex(validHex)),
);
results.push(
	benchmark("isValidHex - valid without prefix", () =>
		isValidHex(validHexNoPrefix),
	),
);
results.push(
	benchmark("isValidHex - invalid length", () => isValidHex(invalidHexShort)),
);
results.push(
	benchmark("isValidHex - invalid chars", () => isValidHex(invalidHexBadChars)),
);
results.push(benchmark("assert - valid", () => assert(hash1)));
results.push(
	benchmark("assert - invalid", () => {
		try {
			assert(validHex);
		} catch {
			// Expected
		}
	}),
);
results.push(benchmark("keccak256 - empty data", () => keccak256(emptyData)));
results.push(
	benchmark("keccak256 - small (32 bytes)", () => keccak256(smallData)),
);
results.push(
	benchmark("keccak256 - medium (1KB)", () => keccak256(mediumData)),
);
results.push(benchmark("keccak256 - large (10KB)", () => keccak256(largeData)));
results.push(benchmark("keccak256String - empty", () => keccak256String("")));
results.push(
	benchmark("keccak256String - short", () => keccak256String("hello")),
);
results.push(
	benchmark("keccak256String - long", () => keccak256String("a".repeat(1000))),
);
results.push(benchmark("keccak256Hex - short", () => keccak256Hex("0x1234")));
results.push(benchmark("keccak256Hex - hash", () => keccak256Hex(validHex)));
results.push(
	benchmark("keccak256Hex - invalid", () => {
		try {
			keccak256Hex("0x123");
		} catch {
			// Expected
		}
	}),
);
results.push(benchmark("random", () => random()));
results.push(benchmark("clone", () => clone(hash1)));
results.push(benchmark("slice - first 4 bytes", () => slice(hash1, 0, 4)));
results.push(benchmark("slice - last 4 bytes", () => slice(hash1, 28, 32)));
results.push(benchmark("slice - middle", () => slice(hash1, 10, 20)));
results.push(benchmark("format - default", () => format(hash1)));
results.push(benchmark("format - custom lengths", () => format(hash1, 10, 8)));

// Sort results (currently unused)
[...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
const categories = {
	Creation: results.filter((r) => r.name.includes("from")),
	Conversion: results.filter(
		(r) =>
			r.name.includes("toHex") ||
			r.name.includes("toBytes") ||
			r.name.includes("toString"),
	),
	Comparison: results.filter(
		(r) => r.name.includes("equals") || r.name.includes("isZero"),
	),
	Validation: results.filter(
		(r) =>
			r.name.includes("isHash") ||
			r.name.includes("isValidHex") ||
			r.name.includes("assert"),
	),
	Hashing: results.filter((r) => r.name.includes("keccak256")),
	Utility: results.filter(
		(r) =>
			r.name.includes("random") ||
			r.name.includes("clone") ||
			r.name.includes("slice") ||
			r.name.includes("format"),
	),
};

for (const [, categoryResults] of Object.entries(categories)) {
	if (categoryResults.length > 0) {
		// Average ops/sec calculation (currently unused)
		categoryResults.reduce((sum, r) => sum + r.opsPerSec, 0) /
			categoryResults.length;
	}
}

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/hash-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
