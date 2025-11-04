/**
 * Gas Constants Benchmarks
 *
 * Measures performance of gas cost calculations
 */

import * as Gas from "./index.js";

// ============================================================================
// Benchmark Runner
// ============================================================================

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
		fn();
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		fn();
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

const testData = new Uint8Array(1000).fill(1);
const testCalldata = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
	testCalldata[i] = i % 2 === 0 ? 0 : i;
}

// ============================================================================
// Hashing Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("GAS HASHING OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- KECCAK256 ---");
results.push(
	benchmark("calculateKeccak256Cost - 32 bytes", () =>
		Gas.calculateKeccak256Cost(32n),
	),
);
results.push(
	benchmark("calculateKeccak256Cost - 1000 bytes", () =>
		Gas.calculateKeccak256Cost(1000n),
	),
);
results.push(
	benchmark("keccak256Cost (this:) - 64 bytes", () =>
		Gas.keccak256Cost.call(64n),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Storage Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS STORAGE OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- SSTORE ---");
results.push(
	benchmark("calculateSstoreCost - warm no-op", () =>
		Gas.calculateSstoreCost(true, 100n, 100n),
	),
);
results.push(
	benchmark("calculateSstoreCost - cold set", () =>
		Gas.calculateSstoreCost(false, 0n, 100n),
	),
);
results.push(
	benchmark("calculateSstoreCost - clear", () =>
		Gas.calculateSstoreCost(true, 100n, 0n),
	),
);
results.push(
	benchmark("sstoreCost (this:) - warm set", () =>
		Gas.sstoreCost.call({ isWarm: true, currentValue: 0n, newValue: 100n }),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Logging Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS LOGGING OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- LOG ---");
results.push(
	benchmark("calculateLogCost - LOG0 no data", () =>
		Gas.calculateLogCost(0n, 0n),
	),
);
results.push(
	benchmark("calculateLogCost - LOG2 64 bytes", () =>
		Gas.calculateLogCost(2n, 64n),
	),
);
results.push(
	benchmark("calculateLogCost - LOG4 1000 bytes", () =>
		Gas.calculateLogCost(4n, 1000n),
	),
);
results.push(
	benchmark("logCost (this:) - LOG2", () =>
		Gas.logCost.call({ topicCount: 2n, dataSize: 64n }),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Call Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS CALL OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- CALL ---");
results.push(
	benchmark("calculateCallCost - warm no value", () =>
		Gas.calculateCallCost(true, false, false, 100000n),
	),
);
results.push(
	benchmark("calculateCallCost - cold with value", () =>
		Gas.calculateCallCost(false, true, false, 100000n),
	),
);
results.push(
	benchmark("calculateCallCost - new account", () =>
		Gas.calculateCallCost(false, true, true, 100000n),
	),
);
results.push(
	benchmark("callCost (this:) - warm call", () =>
		Gas.callCost.call({
			isWarm: true,
			hasValue: false,
			isNewAccount: false,
			availableGas: 100000n,
		}),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Memory Expansion Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS MEMORY EXPANSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- MEMORY ---");
results.push(
	benchmark("calculateMemoryExpansionCost - 0 to 64", () =>
		Gas.calculateMemoryExpansionCost(0n, 64n),
	),
);
results.push(
	benchmark("calculateMemoryExpansionCost - 64 to 128", () =>
		Gas.calculateMemoryExpansionCost(64n, 128n),
	),
);
results.push(
	benchmark("calculateMemoryExpansionCost - 0 to 10240", () =>
		Gas.calculateMemoryExpansionCost(0n, 10240n),
	),
);
results.push(
	benchmark("memoryExpansionCost (this:) - expansion", () =>
		Gas.memoryExpansionCost.call({ oldSize: 0n, newSize: 1024n }),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Contract Creation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS CONTRACT CREATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- CREATE ---");
results.push(
	benchmark("calculateCreateCost - minimal", () =>
		Gas.calculateCreateCost(0n, 0n),
	),
);
results.push(
	benchmark("calculateCreateCost - typical", () =>
		Gas.calculateCreateCost(5000n, 2000n),
	),
);
results.push(
	benchmark("calculateCreateCost - large", () =>
		Gas.calculateCreateCost(40000n, 10000n),
	),
);
results.push(
	benchmark("createCost (this:) - typical", () =>
		Gas.createCost.call({ initcodeSize: 5000n, deployedSize: 2000n }),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Transaction Cost Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS TRANSACTION COST BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- TRANSACTION ---");
results.push(
	benchmark("calculateTxIntrinsicGas - empty", () =>
		Gas.calculateTxIntrinsicGas(new Uint8Array(0), false),
	),
);
results.push(
	benchmark("calculateTxIntrinsicGas - 100 bytes", () =>
		Gas.calculateTxIntrinsicGas(testCalldata, false),
	),
);
results.push(
	benchmark("calculateTxIntrinsicGas - 1000 bytes", () =>
		Gas.calculateTxIntrinsicGas(testData, false),
	),
);
results.push(
	benchmark("txIntrinsicGas (this:) - typical", () =>
		Gas.txIntrinsicGas.call({ data: testCalldata, isCreate: false }),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- COPY & REFUND ---");
results.push(
	benchmark("calculateCopyCost - 64 bytes", () => Gas.calculateCopyCost(64n)),
);
results.push(
	benchmark("calculateCopyCost - 1000 bytes", () =>
		Gas.calculateCopyCost(1000n),
	),
);
results.push(
	benchmark("calculateMaxRefund - typical", () =>
		Gas.calculateMaxRefund(100000n),
	),
);
results.push(
	benchmark("copyCost (this:) - 64 bytes", () => Gas.copyCost.call(64n)),
);
results.push(
	benchmark("maxRefund (this:) - typical", () => Gas.maxRefund.call(100000n)),
);

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Precompile Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS PRECOMPILE BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- HASH PRECOMPILES ---");
results.push(
	benchmark("Precompile.calculateSha256Cost - 64 bytes", () =>
		Gas.Precompile.calculateSha256Cost(64n),
	),
);
results.push(
	benchmark("Precompile.calculateRipemd160Cost - 64 bytes", () =>
		Gas.Precompile.calculateRipemd160Cost(64n),
	),
);
results.push(
	benchmark("Precompile.calculateIdentityCost - 64 bytes", () =>
		Gas.Precompile.calculateIdentityCost(64n),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- MODEXP PRECOMPILE ---");
results.push(
	benchmark("Precompile.calculateModExpCost - small", () =>
		Gas.Precompile.calculateModExpCost(32n, 32n, 32n, 65537n),
	),
);
results.push(
	benchmark("Precompile.calculateModExpCost - RSA-2048", () =>
		Gas.Precompile.calculateModExpCost(256n, 256n, 256n, 65537n),
	),
);
results.push(
	benchmark("Precompile.calculateModExpCost - large", () =>
		Gas.Precompile.calculateModExpCost(512n, 512n, 512n, 65537n),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- BN254 PRECOMPILES ---");
results.push(
	benchmark("Precompile.calculateEcPairingCost - 1 pair Istanbul", () =>
		Gas.Precompile.calculateEcPairingCost(1n, "istanbul"),
	),
);
results.push(
	benchmark("Precompile.calculateEcPairingCost - 3 pairs Istanbul", () =>
		Gas.Precompile.calculateEcPairingCost(3n, "istanbul"),
	),
);
results.push(
	benchmark("Precompile.calculateEcPairingCost - 1 pair Byzantium", () =>
		Gas.Precompile.calculateEcPairingCost(1n, "byzantium"),
	),
);
results.push(
	benchmark("Precompile.ecPairingCost (this:) - 2 pairs", () =>
		Gas.Precompile.ecPairingCost.call({ pairCount: 2n, hardfork: "istanbul" }),
	),
);
results.push(
	benchmark("Precompile.getEcAddCost - Istanbul", () =>
		Gas.Precompile.getEcAddCost("istanbul"),
	),
);
results.push(
	benchmark("Precompile.getEcMulCost - Istanbul", () =>
		Gas.Precompile.getEcMulCost("istanbul"),
	),
);

console.log(
	results
		.slice(-6)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Hardfork Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS HARDFORK UTILITIES BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- HARDFORK DETECTION ---");
results.push(benchmark("hasEIP2929 - Berlin", () => Gas.hasEIP2929("berlin")));
results.push(benchmark("hasEIP3529 - London", () => Gas.hasEIP3529("london")));
results.push(
	benchmark("hasEIP3860 - Shanghai", () => Gas.hasEIP3860("shanghai")),
);
results.push(benchmark("hasEIP1153 - Cancun", () => Gas.hasEIP1153("cancun")));
results.push(benchmark("hasEIP4844 - Cancun", () => Gas.hasEIP4844("cancun")));

console.log(
	results
		.slice(-5)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- HARDFORK-SPECIFIC COSTS ---");
results.push(
	benchmark("getColdSloadCost - Berlin", () => Gas.getColdSloadCost("berlin")),
);
results.push(
	benchmark("getColdAccountAccessCost - London", () =>
		Gas.getColdAccountAccessCost("london"),
	),
);
results.push(
	benchmark("getSstoreRefund - London", () => Gas.getSstoreRefund("london")),
);
results.push(
	benchmark("getSelfdestructRefund - London", () =>
		Gas.getSelfdestructRefund("london"),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Complex Scenarios Benchmark
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("GAS COMPLEX SCENARIOS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- REALISTIC OPERATIONS ---");
results.push(
	benchmark("Full transaction cost calculation", () => {
		const intrinsic = Gas.calculateTxIntrinsicGas(testCalldata, false);
		const sstore = Gas.calculateSstoreCost(false, 0n, 100n);
		const log = Gas.calculateLogCost(2n, 64n);
		return intrinsic + sstore.cost + log;
	}),
);

results.push(
	benchmark("Contract deployment estimation", () => {
		const create = Gas.calculateCreateCost(5000n, 2000n);
		const memory = Gas.calculateMemoryExpansionCost(0n, 5000n);
		return create.total + memory.expansionCost;
	}),
);

results.push(
	benchmark("Complex call with storage and logs", () => {
		const call = Gas.calculateCallCost(false, true, false, 100000n);
		const sstore = Gas.calculateSstoreCost(true, 100n, 200n);
		const log = Gas.calculateLogCost(3n, 256n);
		return call.total + sstore.cost + log;
	}),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
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
console.log("SUMMARY");
console.log(
	"================================================================================\n",
);

const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);

console.log("Top 5 Fastest Operations:");
sorted
	.slice(0, 5)
	.forEach((r, i) =>
		console.log(`  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec`),
	);

console.log("\nTop 5 Slowest Operations:");
sorted
	.slice(-5)
	.reverse()
	.forEach((r, i) =>
		console.log(
			`  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(6)} ms/op)`,
		),
	);

console.log(`\nTotal benchmarks run: ${results.length}`);
console.log(
	`Average operations per second: ${(results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length).toFixed(0)}`,
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/gas-constants-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}\n`);
}
