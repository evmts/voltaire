/**
 * Base64 Performance Benchmarks
 *
 * Compares encoding/decoding performance at various sizes
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import * as Base64 from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const SIZES = {
	tiny: 4,
	small: 32,
	medium: 1024, // 1KB
	large: 65536, // 64KB
} as const;

// Pre-generate test data
// biome-ignore lint/suspicious/noExplicitAny: benchmark requires type flexibility
const testBytes: Record<keyof typeof SIZES, Uint8Array> = {} as any;
// biome-ignore lint/suspicious/noExplicitAny: benchmark requires type flexibility
const testBase64: Record<keyof typeof SIZES, string> = {} as any;
// biome-ignore lint/suspicious/noExplicitAny: benchmark requires type flexibility
const testBase64Url: Record<keyof typeof SIZES, string> = {} as any;

for (const [name, size] of Object.entries(SIZES)) {
	const data = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		data[i] = i & 0xff;
	}
	testBytes[name as keyof typeof SIZES] = data;
	testBase64[name as keyof typeof SIZES] = Base64.encode(data);
	testBase64Url[name as keyof typeof SIZES] = Base64.encodeUrlSafe(data);
}

const testString = "Hello, World! This is a test string for Base64 encoding.";
const longString = testString.repeat(100);

// ============================================================================
// Encoding Benchmarks (Standard)
// ============================================================================

bench("Base64 encode - 4 bytes (tiny)", () => {
	Base64.encode(testBytes.tiny);
});

bench("Base64 encode - 32 bytes (small)", () => {
	Base64.encode(testBytes.small);
});

bench("Base64 encode - 1KB (medium)", () => {
	Base64.encode(testBytes.medium);
});

bench("Base64 encode - 64KB (large)", () => {
	Base64.encode(testBytes.large);
});

bench("Base64 encodeString - short", () => {
	Base64.encodeString(testString);
});

bench("Base64 encodeString - long", () => {
	Base64.encodeString(longString);
});

// ============================================================================
// Decoding Benchmarks (Standard)
// ============================================================================

bench("Base64 decode - 4 bytes (tiny)", () => {
	Base64.decode(testBase64.tiny);
});

bench("Base64 decode - 32 bytes (small)", () => {
	Base64.decode(testBase64.small);
});

bench("Base64 decode - 1KB (medium)", () => {
	Base64.decode(testBase64.medium);
});

bench("Base64 decode - 64KB (large)", () => {
	Base64.decode(testBase64.large);
});

bench("Base64 decodeToString - short", () => {
	Base64.decodeToString(Base64.encodeString(testString));
});

bench("Base64 decodeToString - long", () => {
	Base64.decodeToString(Base64.encodeString(longString));
});

// ============================================================================
// URL-Safe Encoding Benchmarks
// ============================================================================

bench("Base64Url encode - 4 bytes (tiny)", () => {
	Base64.encodeUrlSafe(testBytes.tiny);
});

bench("Base64Url encode - 32 bytes (small)", () => {
	Base64.encodeUrlSafe(testBytes.small);
});

bench("Base64Url encode - 1KB (medium)", () => {
	Base64.encodeUrlSafe(testBytes.medium);
});

bench("Base64Url encode - 64KB (large)", () => {
	Base64.encodeUrlSafe(testBytes.large);
});

bench("Base64Url encodeString - short", () => {
	Base64.encodeStringUrlSafe(testString);
});

bench("Base64Url encodeString - long", () => {
	Base64.encodeStringUrlSafe(longString);
});

// ============================================================================
// URL-Safe Decoding Benchmarks
// ============================================================================

bench("Base64Url decode - 4 bytes (tiny)", () => {
	Base64.decodeUrlSafe(testBase64Url.tiny);
});

bench("Base64Url decode - 32 bytes (small)", () => {
	Base64.decodeUrlSafe(testBase64Url.small);
});

bench("Base64Url decode - 1KB (medium)", () => {
	Base64.decodeUrlSafe(testBase64Url.medium);
});

bench("Base64Url decode - 64KB (large)", () => {
	Base64.decodeUrlSafe(testBase64Url.large);
});

bench("Base64Url decodeToString - short", () => {
	Base64.decodeUrlSafeToString(Base64.encodeStringUrlSafe(testString));
});

bench("Base64Url decodeToString - long", () => {
	Base64.decodeUrlSafeToString(Base64.encodeStringUrlSafe(longString));
});

// ============================================================================
// Validation Benchmarks
// ============================================================================

bench("Base64 isValid - valid small", () => {
	Base64.isValid(testBase64.small);
});

bench("Base64 isValid - valid large", () => {
	Base64.isValid(testBase64.large);
});

bench("Base64 isValid - invalid", () => {
	Base64.isValid("not@valid!base64");
});

bench("Base64Url isValid - valid small", () => {
	Base64.isValidUrlSafe(testBase64Url.small);
});

bench("Base64Url isValid - valid large", () => {
	Base64.isValidUrlSafe(testBase64Url.large);
});

bench("Base64Url isValid - invalid", () => {
	Base64.isValidUrlSafe("not@valid!base64url");
});

// ============================================================================
// Conversion Benchmarks
// ============================================================================

bench("Base64 toBytes - small", () => {
	const b64 = Base64.from(testBase64.small);
	Base64.toBytes(b64);
});

bench("Base64 toBytes - large", () => {
	const b64 = Base64.from(testBase64.large);
	Base64.toBytes(b64);
});

bench("Base64 toString - small", () => {
	const b64 = Base64.from(testBase64.small);
	Base64.toString(b64);
});

bench("Base64 toString - large", () => {
	const b64 = Base64.from(testBase64.large);
	Base64.toString(b64);
});

bench("Base64 toBase64Url - small", () => {
	const b64 = Base64.from(testBase64.small);
	Base64.toBase64Url(b64);
});

bench("Base64Url toBase64 - small", () => {
	const b64url = Base64.fromUrlSafe(testBase64Url.small);
	Base64.toBase64(b64url);
});

// ============================================================================
// Size Calculation Benchmarks
// ============================================================================

bench("Base64 calcEncodedSize", () => {
	Base64.calcEncodedSize(1024);
});

bench("Base64 calcDecodedSize", () => {
	Base64.calcDecodedSize(testBase64.medium);
});

// ============================================================================
// Comparison with Native btoa/atob (Browser APIs)
// ============================================================================

if (typeof btoa !== "undefined") {
	bench("Native btoa - short", () => {
		btoa(testString);
	});

	bench("Base64 encodeString (vs btoa) - short", () => {
		Base64.encodeString(testString);
	});
}

if (typeof atob !== "undefined") {
	const nativeEncoded = Base64.encodeString(testString);

	bench("Native atob - short", () => {
		atob(nativeEncoded);
	});

	bench("Base64 decodeToString (vs atob) - short", () => {
		Base64.decodeToString(nativeEncoded);
	});
}

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
// biome-ignore lint/suspicious/noExplicitAny: benchmark requires type flexibility
const originalSummary = (globalThis as any).summary;
if (!originalSummary) {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark requires type flexibility
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

const outputPath = new URL("./base64-results.json", import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
