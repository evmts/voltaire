/**
 * Authorization Performance Benchmarks
 *
 * Measures performance of EIP-7702 authorization operations
 */

import type { BrandedAddress } from "../Address/index.js";
import * as Authorization from "../Authorization/index.js";

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

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as Address;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);

const validAuth: Authorization.Item = {
	chainId: 1n,
	address: addr1,
	nonce: 0n,
	yParity: 0,
	r: 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn,
	s: 0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210n,
};

const validUnsigned: Authorization.Unsigned = {
	chainId: 1n,
	address: addr1,
	nonce: 0n,
};

// Small list
const smallList: Authorization.Item[] = [
	{
		chainId: 1n,
		address: addr1,
		nonce: 0n,
		yParity: 0,
		r: 0x123n,
		s: 0x456n,
	},
	{
		chainId: 1n,
		address: addr2,
		nonce: 1n,
		yParity: 1,
		r: 0x789n,
		s: 0xabcn,
	},
];

// Medium list
const mediumList: Authorization.Item[] = [];
for (let i = 0; i < 10; i++) {
	mediumList.push({
		chainId: 1n,
		address: createAddress(i),
		nonce: BigInt(i),
		yParity: i % 2,
		r: BigInt(i * 2 + 1),
		s: BigInt(i * 2 + 2),
	});
}

// Large list
const largeList: Authorization.Item[] = [];
for (let i = 0; i < 100; i++) {
	largeList.push({
		chainId: 1n,
		address: createAddress(i % 50),
		nonce: BigInt(i),
		yParity: i % 2,
		r: BigInt(i * 2 + 1),
		s: BigInt(i * 2 + 2),
	});
}

// ============================================================================
// Type Guard Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("AUTHORIZATION TYPE GUARD BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Type Guards ---");
results.push(
	benchmark("isItem - valid", () => Authorization.isItem(validAuth)),
);
results.push(
	benchmark("isItem - invalid (null)", () => Authorization.isItem(null)),
);
results.push(
	benchmark("isItem - invalid (partial)", () =>
		Authorization.isItem({ chainId: 1n }),
	),
);
results.push(
	benchmark("isUnsigned - valid", () =>
		Authorization.isUnsigned(validUnsigned),
	),
);
results.push(
	benchmark("isUnsigned - invalid (null)", () =>
		Authorization.isUnsigned(null),
	),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const invalidChainAuth = { ...validAuth, chainId: 0n };
const invalidAddressAuth = { ...validAuth, address: createAddress(0) };
const invalidYParityAuth = { ...validAuth, yParity: 2 };
const invalidRAuth = { ...validAuth, r: 0n };

console.log("--- Validation Operations ---");
results.push(
	benchmark("validate - valid", () => Authorization.validate.call(validAuth)),
);
results.push(
	benchmark("validate - invalid chain ID", () => {
		try {
			Authorization.validate.call(invalidChainAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid address", () => {
		try {
			Authorization.validate.call(invalidAddressAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid yParity", () => {
		try {
			Authorization.validate.call(invalidYParityAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid r", () => {
		try {
			Authorization.validate.call(invalidRAuth);
		} catch {
			// Expected
		}
	}),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Gas Calculation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION GAS CALCULATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Gas Calculations ---");
results.push(
	benchmark("calculateGasCost - empty list", () =>
		Authorization.calculateGasCost.call([], 0),
	),
);
results.push(
	benchmark("calculateGasCost - small list", () =>
		Authorization.calculateGasCost.call(smallList, 1),
	),
);
results.push(
	benchmark("calculateGasCost - medium list", () =>
		Authorization.calculateGasCost.call(mediumList, 5),
	),
);
results.push(
	benchmark("calculateGasCost - large list", () =>
		Authorization.calculateGasCost.call(largeList, 50),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Per-Authorization Gas Cost ---");
results.push(
	benchmark("getGasCost - not empty", () =>
		Authorization.getGasCost.call(validAuth, false),
	),
);
results.push(
	benchmark("getGasCost - empty account", () =>
		Authorization.getGasCost.call(validAuth, true),
	),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Hashing Benchmarks (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION HASHING BENCHMARKS (Not Implemented)");
console.log(
	"================================================================================\n",
);

console.log("--- Hashing Operations ---");
results.push(
	benchmark("hash", () => {
		try {
			Authorization.hash.call(validUnsigned);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

// ============================================================================
// Signing Benchmarks (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION SIGNING BENCHMARKS (Not Implemented)");
console.log(
	"================================================================================\n",
);

const privateKey = new Uint8Array(32);

console.log("--- Signing Operations ---");
results.push(
	benchmark("sign", () => {
		try {
			Authorization.sign.call(validUnsigned, privateKey);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

// ============================================================================
// Verification Benchmarks (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION VERIFICATION BENCHMARKS (Not Implemented)");
console.log(
	"================================================================================\n",
);

console.log("--- Verification Operations ---");
results.push(
	benchmark("verify", () => {
		try {
			Authorization.verify.call(validAuth);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

// ============================================================================
// Processing Benchmarks (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION PROCESSING BENCHMARKS (Not Implemented)");
console.log(
	"================================================================================\n",
);

console.log("--- Processing Operations ---");
results.push(
	benchmark("process", () => {
		try {
			Authorization.process.call(validAuth);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("processAll - empty", () => Authorization.processAll.call([])),
);
results.push(
	benchmark("processAll - small list", () => {
		try {
			Authorization.processAll.call(smallList);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

// ============================================================================
// Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("AUTHORIZATION UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Formatting Operations ---");
results.push(
	benchmark("format - signed", () => Authorization.format.call(validAuth)),
);
results.push(
	benchmark("format - unsigned", () =>
		Authorization.format.call(validUnsigned),
	),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Comparison Operations ---");
const auth2 = { ...validAuth };
const auth3 = { ...validAuth, nonce: 1n };
results.push(
	benchmark("equals - same", () => Authorization.equals.call(validAuth, auth2)),
);
results.push(
	benchmark("equals - different", () =>
		Authorization.equals.call(validAuth, auth3),
	),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("Benchmarks complete!");
console.log(
	"================================================================================",
);
console.log(`\nTotal benchmarks run: ${results.length}`);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(
	`\nFastest: ${sorted[0]!.name} - ${sorted[0]!.opsPerSec.toFixed(0)} ops/sec`,
);
console.log(
	`Slowest: ${sorted[sorted.length - 1]!.name} - ${sorted[sorted.length - 1]!.opsPerSec.toFixed(0)} ops/sec`,
);

console.log(
	"\nNote: BrandedHash, sign, verify, and process operations throw 'Not implemented'",
);
console.log("These benchmarks measure error handling overhead.");
console.log(
	"Real performance metrics will be available after implementation.\n",
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/authorization-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
