/**
 * Blob Operations Benchmarks (EIP-4844)
 *
 * Measures performance of blob encoding, validation, and utility functions
 */

import * as Blob from "./Blob.js";

// Benchmark runner
interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeMs: number;
  iterations: number;
}

function benchmark(name: string, fn: () => void, duration = 2000): BenchmarkResult {
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
const maxData = new Uint8Array(Blob.SIZE - 8).fill(0xef);

// Pre-created blobs for decoding benchmarks
const smallBlob = Blob.fromData(smallData);
const mediumBlob = Blob.fromData(mediumData);
const largeBlob = Blob.fromData(largeData);
const maxBlob = Blob.fromData(maxData);

// Data for splitting
const multiBlob1 = new Uint8Array(200000).fill(0x12);
const multiBlob3 = new Uint8Array(350000).fill(0x34);
const multiBlob6 = new Uint8Array(750000).fill(0x56);

// ============================================================================
// Data Encoding Benchmarks
// ============================================================================

console.log("================================================================================");
console.log("BLOB ENCODING BENCHMARKS");
console.log("================================================================================\n");

const results: BenchmarkResult[] = [];

console.log("--- Data Encoding (fromData) ---");
results.push(benchmark("fromData - small (13 bytes)", () => Blob.fromData(smallData)));
results.push(benchmark("fromData - medium (10 KB)", () => Blob.fromData(mediumData)));
results.push(benchmark("fromData - large (100 KB)", () => Blob.fromData(largeData)));
results.push(benchmark("fromData - max (128 KB)", () => Blob.fromData(maxData)));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Data Decoding Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("BLOB DECODING BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Data Decoding (toData) ---");
results.push(benchmark("toData - small (13 bytes)", () => Blob.toData.call(smallBlob)));
results.push(benchmark("toData - medium (10 KB)", () => Blob.toData.call(mediumBlob)));
results.push(benchmark("toData - large (100 KB)", () => Blob.toData.call(largeBlob)));
results.push(benchmark("toData - max (128 KB)", () => Blob.toData.call(maxBlob)));

console.log(
  results
    .slice(-4)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("VALIDATION BENCHMARKS");
console.log("================================================================================\n");

const validBlob = new Uint8Array(Blob.SIZE);
const invalidBlob = new Uint8Array(100);
const validCommitment = new Uint8Array(48);
const invalidCommitment = new Uint8Array(32);
const validProof = new Uint8Array(48);
const validHash = new Uint8Array(32);
validHash[0] = Blob.COMMITMENT_VERSION_KZG;

console.log("--- Type Guards ---");
results.push(benchmark("Blob.isValid - valid", () => Blob.isValid(validBlob)));
results.push(benchmark("Blob.isValid - invalid", () => Blob.isValid(invalidBlob)));
results.push(
  benchmark("Commitment.isValid - valid", () => Blob.Commitment.isValid(validCommitment)),
);
results.push(
  benchmark("Commitment.isValid - invalid", () =>
    Blob.Commitment.isValid(invalidCommitment),
  ),
);
results.push(benchmark("Proof.isValid - valid", () => Blob.Proof.isValid(validProof)));
results.push(
  benchmark("VersionedHash.isValid - valid", () => Blob.VersionedHash.isValid(validHash)),
);

console.log(
  results
    .slice(-6)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Version Checks ---");
const versionedHash = new Uint8Array(32) as Blob.VersionedHash;
versionedHash[0] = Blob.COMMITMENT_VERSION_KZG;

results.push(
  benchmark("isValidVersion", () => Blob.isValidVersion.call(versionedHash)),
);
results.push(
  benchmark("VersionedHash.getVersion", () =>
    Blob.VersionedHash.getVersion(versionedHash),
  ),
);
results.push(
  benchmark("VersionedHash.version", () => Blob.VersionedHash.version.call(versionedHash)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Utility Function Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("UTILITY FUNCTION BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Gas Calculations ---");
results.push(benchmark("calculateGas - 1 blob", () => Blob.calculateGas(1)));
results.push(benchmark("calculateGas - 3 blobs", () => Blob.calculateGas(3)));
results.push(
  benchmark("calculateGas - 6 blobs", () =>
    Blob.calculateGas(Blob.MAX_PER_TRANSACTION),
  ),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Blob Estimation ---");
results.push(benchmark("estimateBlobCount - small", () => Blob.estimateBlobCount(1000)));
results.push(
  benchmark("estimateBlobCount - medium", () => Blob.estimateBlobCount(100000)),
);
results.push(
  benchmark("estimateBlobCount - large", () => Blob.estimateBlobCount(500000)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Splitting/Joining Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("SPLITTING/JOINING BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Data Splitting ---");
results.push(
  benchmark("splitData - 2 blobs (200 KB)", () => Blob.splitData(multiBlob1)),
);
results.push(
  benchmark("splitData - 3 blobs (350 KB)", () => Blob.splitData(multiBlob3)),
);
results.push(
  benchmark("splitData - 6 blobs (750 KB)", () => Blob.splitData(multiBlob6)),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Data Joining ---");
const split1 = Blob.splitData(multiBlob1);
const split3 = Blob.splitData(multiBlob3);
const split6 = Blob.splitData(multiBlob6);

results.push(benchmark("joinData - 2 blobs (200 KB)", () => Blob.joinData(split1)));
results.push(benchmark("joinData - 3 blobs (350 KB)", () => Blob.joinData(split3)));
results.push(benchmark("joinData - 6 blobs (750 KB)", () => Blob.joinData(split6)));

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// Roundtrip Benchmarks
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("ROUNDTRIP BENCHMARKS");
console.log("================================================================================\n");

console.log("--- Encode + Decode Cycles ---");
results.push(
  benchmark("encode + decode - small", () => {
    const blob = Blob.fromData(smallData);
    Blob.toData.call(blob);
  }),
);
results.push(
  benchmark("encode + decode - medium", () => {
    const blob = Blob.fromData(mediumData);
    Blob.toData.call(blob);
  }),
);
results.push(
  benchmark("encode + decode - large", () => {
    const blob = Blob.fromData(largeData);
    Blob.toData.call(blob);
  }),
);

console.log(
  results
    .slice(-3)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

console.log("\n--- Split + Join Cycles ---");
results.push(
  benchmark("split + join - 2 blobs", () => {
    const blobs = Blob.splitData(multiBlob1);
    Blob.joinData(blobs);
  }),
);
results.push(
  benchmark("split + join - 3 blobs", () => {
    const blobs = Blob.splitData(multiBlob3);
    Blob.joinData(blobs);
  }),
);

console.log(
  results
    .slice(-2)
    .map(
      (r) => `  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
    )
    .join("\n"),
);

// ============================================================================
// KZG Operations (Not Implemented)
// ============================================================================

console.log("\n");
console.log("================================================================================");
console.log("KZG OPERATIONS BENCHMARKS (Not Implemented)");
console.log("================================================================================\n");

console.log("--- KZG Commitment/Proof Generation ---");
results.push(
  benchmark("toCommitment", () => {
    try {
      Blob.toCommitment.call(smallBlob);
    } catch {
      // Expected - not implemented
    }
  }),
);
results.push(
  benchmark("toProof", () => {
    try {
      Blob.toProof.call(smallBlob, validCommitment as Blob.Commitment);
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
      Blob.verify.call(
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
      Blob.verifyBatch(
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
  benchmark("toVersionedHash", async () => {
    try {
      await Blob.toVersionedHash.call(validCommitment as Blob.Commitment);
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
console.log("================================================================================");
console.log("Benchmarks complete!");
console.log("================================================================================");
console.log(`\nTotal benchmarks run: ${results.length}`);
console.log(
  "\nNote: KZG operations (commitment, proof, verification) throw 'Not implemented'",
);
console.log("These benchmarks measure error handling overhead.");
console.log("Real performance metrics will be available after KZG implementation.\n");

// Export results for analysis
if (typeof Bun !== "undefined") {
  const resultsFile = "/Users/williamcory/primitives/src/primitives/blob-results.json";
  await Bun.write(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}\n`);
}
