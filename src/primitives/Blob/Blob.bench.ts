/**
 * Blob Operations Benchmarks (EIP-4844)
 *
 * Measures performance of blob encoding, validation, and utility functions
 */

import type { BrandedBlob, Commitment, Proof, VersionedHash } from "./BrandedBlob.js";
import { from } from "./from.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";
import { toData } from "./toData.js";
import { toCommitment } from "./toCommitment.js";
import { toProof } from "./toProof.js";
import { toVersionedHash } from "./toVersionedHash.js";
import { verify } from "./verify.js";
import { verifyBatch } from "./verifyBatch.js";
import { isValidVersion } from "./isValidVersion.js";
import { calculateGas } from "./calculateGas.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { splitData } from "./splitData.js";
import { joinData } from "./joinData.js";
import { SIZE, COMMITMENT_VERSION_KZG, MAX_PER_TRANSACTION } from "./constants.js";
import * as Blob from "./Blob.js";

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
			// Ignore errors during warmup (for not-implemented functions)
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

const smallData = new TextEncoder().encode("Hello, blob!");
const mediumData = new Uint8Array(10000).fill(0xab);
const largeData = new Uint8Array(100000).fill(0xcd);
const maxData = new Uint8Array(SIZE - 8).fill(0xef);

// Pre-created blobs for decoding benchmarks
const smallBlob = fromData(smallData);
const mediumBlob = fromData(mediumData);
const largeBlob = fromData(largeData);
const maxBlob = fromData(maxData);

// Data for splitting
const multiBlob1 = new Uint8Array(200000).fill(0x12);
const multiBlob3 = new Uint8Array(350000).fill(0x34);
const multiBlob6 = new Uint8Array(750000).fill(0x56);

// ============================================================================
// Data Encoding Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("BLOB ENCODING BENCHMARKS");
console.log(
	"================================================================================\n",
);

const results: BenchmarkResult[] = [];

console.log("--- Data Encoding (fromData) ---");
results.push(
	benchmark("fromData - small (13 bytes)", () => fromData(smallData)),
);
results.push(
	benchmark("fromData - medium (10 KB)", () => fromData(mediumData)),
);
results.push(
	benchmark("fromData - large (100 KB)", () => fromData(largeData)),
);
results.push(
	benchmark("fromData - max (128 KB)", () => fromData(maxData)),
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

// ============================================================================
// Data Decoding Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("BLOB DECODING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Data Decoding (toData) ---");
results.push(
	benchmark("toData - small (13 bytes)", () => toData(smallBlob)),
);
results.push(
	benchmark("toData - medium (10 KB)", () => toData(mediumBlob)),
);
results.push(
	benchmark("toData - large (100 KB)", () => toData(largeBlob)),
);
results.push(benchmark("toData - max (128 KB)", () => toData(maxBlob)));

console.log(
	results
		.slice(-4)
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
console.log("VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

const validBlob = new Uint8Array(SIZE);
const invalidBlob = new Uint8Array(100);
const validCommitment = new Uint8Array(48);
const invalidCommitment = new Uint8Array(32);
const validProof = new Uint8Array(48);
const validHash = new Uint8Array(32);
validHash[0] = COMMITMENT_VERSION_KZG;

console.log("--- Type Guards ---");
results.push(benchmark("isValid - valid", () => isValid(validBlob)));
results.push(
	benchmark("isValid - invalid", () => isValid(invalidBlob)),
);
results.push(
	benchmark("Commitment.isValid - valid", () =>
		Blob.Commitment.isValid(validCommitment),
	),
);
results.push(
	benchmark("Commitment.isValid - invalid", () =>
		Blob.Commitment.isValid(invalidCommitment),
	),
);
results.push(
	benchmark("Proof.isValid - valid", () => Blob.Proof.isValid(validProof)),
);
results.push(
	benchmark("VersionedHash.isValid - valid", () =>
		Blob.VersionedHash.isValid(validHash),
	),
);

console.log(
	results
		.slice(-6)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- Version Checks ---");
const versionedHash = new Uint8Array(32) as VersionedHash;
versionedHash[0] = COMMITMENT_VERSION_KZG;

results.push(
	benchmark("isValidVersion", () => isValidVersion(versionedHash)),
);
results.push(
	benchmark("VersionedHash.getVersion", () =>
		Blob.VersionedHash.getVersion(versionedHash),
	),
);
results.push(
	benchmark("VersionedHash.version", () =>
		versionedHash[0],
	),
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
// Utility Function Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("UTILITY FUNCTION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Gas Calculations ---");
results.push(benchmark("calculateGas - 1 blob", () => calculateGas(1)));
results.push(benchmark("calculateGas - 3 blobs", () => calculateGas(3)));
results.push(
	benchmark("calculateGas - 6 blobs", () =>
		calculateGas(MAX_PER_TRANSACTION),
	),
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

console.log("\n--- Blob Estimation ---");
results.push(
	benchmark("estimateBlobCount - small", () => estimateBlobCount(1000)),
);
results.push(
	benchmark("estimateBlobCount - medium", () => estimateBlobCount(100000)),
);
results.push(
	benchmark("estimateBlobCount - large", () => estimateBlobCount(500000)),
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
// Splitting/Joining Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("SPLITTING/JOINING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Data Splitting ---");
results.push(
	benchmark("splitData - 2 blobs (200 KB)", () => splitData(multiBlob1)),
);
results.push(
	benchmark("splitData - 3 blobs (350 KB)", () => splitData(multiBlob3)),
);
results.push(
	benchmark("splitData - 6 blobs (750 KB)", () => splitData(multiBlob6)),
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

console.log("\n--- Data Joining ---");
const split1 = splitData(multiBlob1);
const split3 = splitData(multiBlob3);
const split6 = splitData(multiBlob6);

results.push(
	benchmark("joinData - 2 blobs (200 KB)", () => joinData(split1)),
);
results.push(
	benchmark("joinData - 3 blobs (350 KB)", () => joinData(split3)),
);
results.push(
	benchmark("joinData - 6 blobs (750 KB)", () => joinData(split6)),
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
// Roundtrip Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("ROUNDTRIP BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- Encode + Decode Cycles ---");
results.push(
	benchmark("encode + decode - small", () => {
		const blob = fromData(smallData);
		toData(blob);
	}),
);
results.push(
	benchmark("encode + decode - medium", () => {
		const blob = fromData(mediumData);
		toData(blob);
	}),
);
results.push(
	benchmark("encode + decode - large", () => {
		const blob = fromData(largeData);
		toData(blob);
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

console.log("\n--- Split + Join Cycles ---");
results.push(
	benchmark("split + join - 2 blobs", () => {
		const blobs = splitData(multiBlob1);
		joinData(blobs);
	}),
);
results.push(
	benchmark("split + join - 3 blobs", () => {
		const blobs = splitData(multiBlob3);
		joinData(blobs);
	}),
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
// KZG Operations (Not Implemented)
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("KZG OPERATIONS BENCHMARKS (Not Implemented)");
console.log(
	"================================================================================\n",
);

console.log("--- KZG Commitment/Proof Generation ---");
results.push(
	benchmark("toCommitment", () => {
		try {
			toCommitment(smallBlob);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("toProof", () => {
		try {
			toProof(smallBlob, validCommitment as Blob.Commitment);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

console.log("\n--- KZG Verification ---");
results.push(
	benchmark("verify", () => {
		try {
			verify(
				smallBlob,
				validCommitment as Blob.Commitment,
				validProof as Blob.Proof,
			);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("verifyBatch - 3 blobs", () => {
		try {
			verifyBatch(
				[smallBlob, smallBlob, smallBlob],
				[
					validCommitment as Blob.Commitment,
					validCommitment as Blob.Commitment,
					validCommitment as Blob.Commitment,
				],
				[
					validProof as Blob.Proof,
					validProof as Blob.Proof,
					validProof as Blob.Proof,
				],
			);
		} catch {
			// Expected - not implemented
		}
	}),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op) [throws NotImplemented]`,
		)
		.join("\n"),
);

console.log("\n--- Versioned Hash ---");
results.push(
	benchmark("toVersionedHash", () => {
		try {
			toVersionedHash(validCommitment as Blob.Commitment);
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
console.log(
	"\nNote: KZG operations (commitment, proof, verification) throw 'Not implemented'",
);
console.log("These benchmarks measure error handling overhead.");
console.log(
	"Real performance metrics will be available after KZG implementation.\n",
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/blob-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
