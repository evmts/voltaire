/**
 * Blob Operations Benchmarks (EIP-4844)
 *
 * Measures performance of blob encoding, validation, and utility functions
 */

import type { Commitment, Proof, VersionedHash } from "./BrandedBlob.js";
import { calculateGas } from "./BrandedBlob/calculateGas.js";
import {
	COMMITMENT_VERSION_KZG,
	MAX_PER_TRANSACTION,
	SIZE,
} from "./BrandedBlob/constants.js";
import { estimateBlobCount } from "./BrandedBlob/estimateBlobCount.js";
import { fromData } from "./BrandedBlob/fromData.js";
import { isValid } from "./BrandedBlob/isValid.js";
import { isValidVersion } from "./BrandedBlob/isValidVersion.js";
import { joinData } from "./BrandedBlob/joinData.js";
import { splitData } from "./BrandedBlob/splitData.js";
import { toCommitment } from "./BrandedBlob/toCommitment.js";
import { toData } from "./BrandedBlob/toData.js";
import { toProof } from "./BrandedBlob/toProof.js";
import { toVersionedHash } from "./BrandedBlob/toVersionedHash.js";
import { verify } from "./BrandedBlob/verify.js";
import { verifyBatch } from "./BrandedBlob/verifyBatch.js";

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

const results: BenchmarkResult[] = [];
results.push(
	benchmark("fromData - small (13 bytes)", () => fromData(smallData)),
);
results.push(
	benchmark("fromData - medium (10 KB)", () => fromData(mediumData)),
);
results.push(benchmark("fromData - large (100 KB)", () => fromData(largeData)));
results.push(benchmark("fromData - max (128 KB)", () => fromData(maxData)));
results.push(benchmark("toData - small (13 bytes)", () => toData(smallBlob)));
results.push(benchmark("toData - medium (10 KB)", () => toData(mediumBlob)));
results.push(benchmark("toData - large (100 KB)", () => toData(largeBlob)));
results.push(benchmark("toData - max (128 KB)", () => toData(maxBlob)));

const validBlob = new Uint8Array(SIZE);
const invalidBlob = new Uint8Array(100);
const validCommitment = new Uint8Array(48);
const invalidCommitment = new Uint8Array(32);
const validProof = new Uint8Array(48);
const validHash = new Uint8Array(32);
validHash[0] = COMMITMENT_VERSION_KZG;
results.push(benchmark("isValid - valid", () => isValid(validBlob)));
results.push(benchmark("isValid - invalid", () => isValid(invalidBlob)));
results.push(
	benchmark(
		"Commitment.isValid - valid",
		() => validCommitment.byteLength === 48,
	),
);
results.push(
	benchmark(
		"Commitment.isValid - invalid",
		() => invalidCommitment.byteLength === 48,
	),
);
results.push(
	benchmark("Proof.isValid - valid", () => validProof.byteLength === 48),
);
results.push(
	benchmark(
		"VersionedHash.isValid - valid",
		() =>
			validHash.byteLength === 32 && validHash[0] === COMMITMENT_VERSION_KZG,
	),
);
const versionedHash = new Uint8Array(32) as VersionedHash;
versionedHash[0] = COMMITMENT_VERSION_KZG;

results.push(benchmark("isValidVersion", () => isValidVersion(versionedHash)));
results.push(benchmark("VersionedHash.getVersion", () => versionedHash[0]));
results.push(benchmark("VersionedHash.version", () => versionedHash[0]));
results.push(benchmark("calculateGas - 1 blob", () => calculateGas(1)));
results.push(benchmark("calculateGas - 3 blobs", () => calculateGas(3)));
results.push(
	benchmark("calculateGas - 6 blobs", () => calculateGas(MAX_PER_TRANSACTION)),
);
results.push(
	benchmark("estimateBlobCount - small", () => estimateBlobCount(1000)),
);
results.push(
	benchmark("estimateBlobCount - medium", () => estimateBlobCount(100000)),
);
results.push(
	benchmark("estimateBlobCount - large", () => estimateBlobCount(500000)),
);
results.push(
	benchmark("splitData - 2 blobs (200 KB)", () => splitData(multiBlob1)),
);
results.push(
	benchmark("splitData - 3 blobs (350 KB)", () => splitData(multiBlob3)),
);
results.push(
	benchmark("splitData - 6 blobs (750 KB)", () => splitData(multiBlob6)),
);
const split1 = splitData(multiBlob1);
const split3 = splitData(multiBlob3);
const split6 = splitData(multiBlob6);

results.push(benchmark("joinData - 2 blobs (200 KB)", () => joinData(split1)));
results.push(benchmark("joinData - 3 blobs (350 KB)", () => joinData(split3)));
results.push(benchmark("joinData - 6 blobs (750 KB)", () => joinData(split6)));
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
			toProof(smallBlob, validCommitment as Commitment);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("verify", () => {
		try {
			verify(smallBlob, validCommitment as Commitment, validProof as Proof);
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
					validCommitment as Commitment,
					validCommitment as Commitment,
					validCommitment as Commitment,
				],
				[validProof as Proof, validProof as Proof, validProof as Proof],
			);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("toVersionedHash", () => {
		try {
			toVersionedHash(validCommitment as Commitment);
		} catch {
			// Expected - not implemented
		}
	}),
);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/blob-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
