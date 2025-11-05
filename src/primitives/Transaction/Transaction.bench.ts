/**
 * Transaction Benchmarks
 *
 * Measures performance of transaction operations
 */

import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/index.js";
import { Hash } from "../Hash/index.js";
import * as Transaction from "../Transaction/index.js";
import type {
	EIP1559,
	EIP2930,
	EIP4844,
	EIP7702,
	Legacy,
} from "../Transaction/types.js";

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
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

function createHash(byte: number): BrandedHash {
	const hash = new Uint8Array(32);
	hash.fill(byte);
	return hash as BrandedHash;
}

function createBytes(length: number, fill = 0): Uint8Array {
	const bytes = new Uint8Array(length);
	bytes.fill(fill);
	return bytes;
}

const testAddress = createAddress(1);
const testHash = createHash(10);
const testSignature = {
	r: createBytes(32, 1),
	s: createBytes(32, 2),
};

const legacyTx: Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 27n,
	r: testSignature.r,
	s: testSignature.s,
};

const eip155Tx: Legacy = {
	...legacyTx,
	v: 37n, // Chain ID 1
};

const eip2930Tx: EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	accessList: [{ address: testAddress, storageKeys: [testHash] }],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip1559Tx: EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	accessList: [{ address: testAddress, storageKeys: [testHash] }],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip4844Tx: EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 100000n,
	to: testAddress,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	maxFeePerBlobGas: 2000000000n,
	blobVersionedHashes: [testHash, createHash(20)],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip7702Tx: EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 100000n,
	to: testAddress,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	authorizationList: [],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const typedTxData = new Uint8Array([0x02, 0xc0]);
const legacyTxData = new Uint8Array([0xc0]);

// ============================================================================
// Type Guard Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("TRANSACTION TYPE GUARD BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Type Guards ---");
results.push(
	benchmark("Transaction.isLegacy", () => Transaction.isLegacy(legacyTx)),
);
results.push(
	benchmark("Transaction.isEIP2930", () => Transaction.isEIP2930(eip2930Tx)),
);
results.push(
	benchmark("Transaction.isEIP1559", () => Transaction.isEIP1559(eip1559Tx)),
);
results.push(
	benchmark("Transaction.isEIP4844", () => Transaction.isEIP4844(eip4844Tx)),
);
results.push(
	benchmark("Transaction.isEIP7702", () => Transaction.isEIP7702(eip7702Tx)),
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
// Type Detection Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("TRANSACTION TYPE DETECTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Type Detection ---");
results.push(
	benchmark("Transaction.detectType - typed tx", () =>
		Transaction.detectType(typedTxData),
	),
);
results.push(
	benchmark("Transaction.detectType - legacy tx", () =>
		Transaction.detectType(legacyTxData),
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
// Legacy Transaction Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("LEGACY TRANSACTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Legacy Chain ID ---");
results.push(
	benchmark("Legacy.getChainId - EIP-155", () =>
		Transaction.Legacy.getChainId(eip155Tx),
	),
);
results.push(
	benchmark("Legacy.getChainId - pre-EIP-155", () =>
		Transaction.Legacy.getChainId(legacyTx),
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

console.log("\n--- Legacy Serialization (Not Implemented) ---");
results.push(
	benchmark("Legacy.serialize", () => {
		try {
			Transaction.Legacy.serialize(legacyTx);
		} catch {}
	}),
);
results.push(
	benchmark("Legacy.hash", () => {
		try {
			Transaction.Legacy.hash(legacyTx);
		} catch {}
	}),
);
results.push(
	benchmark("Legacy.getSigningHash", () => {
		try {
			Transaction.Legacy.getSigningHash(legacyTx);
		} catch {}
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
// EIP-1559 Transaction Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("EIP-1559 TRANSACTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- EIP-1559 Gas Calculation ---");
const baseFee = 10000000000n;
results.push(
	benchmark("EIP1559.getEffectiveGasPrice", () =>
		Transaction.EIP1559.getEffectiveGasPrice(eip1559Tx, baseFee),
	),
);

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- EIP-1559 Serialization (Not Implemented) ---");
results.push(
	benchmark("EIP1559.serialize", () => {
		try {
			Transaction.EIP1559.serialize(eip1559Tx);
		} catch {}
	}),
);
results.push(
	benchmark("EIP1559.hash", () => {
		try {
			Transaction.EIP1559.hash(eip1559Tx);
		} catch {}
	}),
);
results.push(
	benchmark("EIP1559.getSigningHash", () => {
		try {
			Transaction.EIP1559.getSigningHash(eip1559Tx);
		} catch {}
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
// EIP-4844 Transaction Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("EIP-4844 TRANSACTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- EIP-4844 Gas Calculation ---");
const blobBaseFee = 1n;
results.push(
	benchmark("EIP4844.getBlobGasCost", () =>
		Transaction.EIP4844.getBlobGasCost(eip4844Tx, blobBaseFee),
	),
);
results.push(
	benchmark("EIP4844.getEffectiveGasPrice", () =>
		Transaction.EIP4844.getEffectiveGasPrice(eip4844Tx, baseFee),
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

console.log("\n--- EIP-4844 Serialization (Not Implemented) ---");
results.push(
	benchmark("EIP4844.serialize", () => {
		try {
			Transaction.EIP4844.serialize(eip4844Tx);
		} catch {}
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
// EIP-7702 Transaction Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("EIP-7702 TRANSACTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- EIP-7702 Gas Calculation ---");
results.push(
	benchmark("EIP7702.getEffectiveGasPrice", () =>
		Transaction.EIP7702.getEffectiveGasPrice(eip7702Tx, baseFee),
	),
);

console.log(
	results
		.slice(-1)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Transaction-Level Operations
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("TRANSACTION-LEVEL OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Universal Operations ---");
results.push(
	benchmark("Transaction.format - legacy", () => Transaction.format(legacyTx)),
);
results.push(
	benchmark("Transaction.format - EIP-1559", () =>
		Transaction.format(eip1559Tx),
	),
);
results.push(
	benchmark("Transaction.getGasPrice - legacy", () =>
		Transaction.getGasPrice(legacyTx),
	),
);
results.push(
	benchmark("Transaction.getGasPrice - EIP-1559", () =>
		Transaction.getGasPrice(eip1559Tx, baseFee),
	),
);
results.push(
	benchmark("Transaction.hasAccessList", () =>
		Transaction.hasAccessList(legacyTx),
	),
);
results.push(
	benchmark("Transaction.getAccessList", () =>
		Transaction.getAccessList(eip1559Tx),
	),
);
results.push(
	benchmark("Transaction.getChainId", () => Transaction.getChainId(eip1559Tx)),
);
results.push(
	benchmark("Transaction.isSigned", () => Transaction.isSigned(legacyTx)),
);

console.log(
	results
		.slice(-8)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Transaction Creation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("TRANSACTION CREATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Transaction Object Creation ---");
results.push(
	benchmark("Create Legacy Transaction", () => {
		const tx: Legacy = {
			type: Transaction.Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);
results.push(
	benchmark("Create EIP-1559 Transaction", () => {
		const tx: EIP1559 = {
			type: Transaction.Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);
results.push(
	benchmark("Create EIP-4844 Transaction", () => {
		const tx: EIP4844 = {
			type: Transaction.Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: testAddress,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: [testHash],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Field Access Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("FIELD ACCESS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Field Access Performance ---");
results.push(benchmark("Access nonce", () => legacyTx.nonce));
results.push(benchmark("Access gasPrice", () => legacyTx.gasPrice));
results.push(benchmark("Access to address", () => legacyTx.to));
results.push(benchmark("Access value", () => legacyTx.value));
results.push(benchmark("Access data", () => legacyTx.data));
results.push(benchmark("Access signature (r)", () => legacyTx.r));

console.log(
	results
		.slice(-6)
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
console.log("\nFastest operations:");

const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
sorted.slice(0, 5).forEach((r, i) => {
	console.log(`  ${i + 1}. ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec`);
});

console.log(
	"\nNote: Most serialization/hashing operations throw 'Not implemented'",
);
console.log("These benchmarks measure error handling overhead.");
console.log(
	"Real performance metrics will be available after implementation.\n",
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/transaction-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
