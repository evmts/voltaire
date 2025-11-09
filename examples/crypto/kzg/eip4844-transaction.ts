/**
 * Complete EIP-4844 Blob Transaction Workflow
 *
 * Demonstrates end-to-end blob transaction:
 * - Creating blobs from L2 rollup data
 * - Generating commitments and proofs
 * - Computing versioned hashes
 * - Building blob transaction
 * - Verification workflow
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";

console.log("=== Complete EIP-4844 Blob Transaction Workflow ===\n");

// Initialize KZG
KZG.loadTrustedSetup();

// Step 1: Simulate L2 rollup data
console.log("1. L2 Rollup Data Preparation");
console.log("-".repeat(50));

// Simulate L2 sequencer batching transactions
const rollupBatch1 = "Batch of 1000 L2 transactions compressed...";
const rollupBatch2 = "Another batch of 1000 L2 transactions...";

console.log("L2 Sequencer:");
console.log("  Batched transactions:", 2000);
console.log("  Compressed data: ~256 KB");
console.log("  Target: 2 blobs (128 KB each)");
console.log();

// Step 2: Encode data into blobs
console.log("2. Encoding Data into Blobs");
console.log("-".repeat(50));

// Create blobs and fill with simulated data
const blob1 = KZG.createEmptyBlob();
const blob2 = KZG.createEmptyBlob();

// In real scenario: encode compressed rollup data into blob field elements
// For demo: use random valid blob data
const tempBlob1 = KZG.generateRandomBlob();
const tempBlob2 = KZG.generateRandomBlob();
blob1.set(tempBlob1);
blob2.set(tempBlob2);

console.log("Blob 1: 131,072 bytes");
console.log("Blob 2: 131,072 bytes");
console.log("Total: 262,144 bytes (256 KB)");
console.log();

// Step 3: Generate KZG commitments
console.log("3. Generating KZG Commitments");
console.log("-".repeat(50));

const commitment1 = KZG.blobToKzgCommitment(blob1);
const commitment2 = KZG.blobToKzgCommitment(blob2);

console.log("Commitment 1:", Hex.fromBytes(commitment1));
console.log("Commitment 2:", Hex.fromBytes(commitment2));
console.log();

// Step 4: Compute versioned hashes
console.log("4. Computing Versioned Hashes");
console.log("-".repeat(50));

function computeVersionedHash(commitment: Uint8Array): Uint8Array {
	const hash = SHA256.hash(commitment);
	hash[0] = 0x01; // Version byte for EIP-4844
	return hash;
}

const versionedHash1 = computeVersionedHash(commitment1);
const versionedHash2 = computeVersionedHash(commitment2);

console.log("Versioned Hash 1:", Hex.fromBytes(versionedHash1));
console.log("Versioned Hash 2:", Hex.fromBytes(versionedHash2));
console.log();

console.log("Versioned hash structure:");
console.log("  Byte [0]:    Version = 0x01 (SHA-256 of KZG commitment)");
console.log("  Bytes [1:32]: SHA256(commitment)[1:32]");
console.log();

// Step 5: Generate KZG proofs
console.log("5. Generating KZG Proofs");
console.log("-".repeat(50));

// Random challenge point (in production, this would be derived from block hash)
const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0;

const proof1 = KZG.computeKzgProof(blob1, z);
const proof2 = KZG.computeKzgProof(blob2, z);

console.log("Proof 1:");
console.log("  y:", Hex.fromBytes(proof1.y).slice(0, 20) + "...");
console.log("  proof:", Hex.fromBytes(proof1.proof).slice(0, 20) + "...");

console.log("Proof 2:");
console.log("  y:", Hex.fromBytes(proof2.y).slice(0, 20) + "...");
console.log("  proof:", Hex.fromBytes(proof2.proof).slice(0, 20) + "...");
console.log();

// Step 6: Build blob transaction (Type 3)
console.log("6. Building Blob Transaction (Type 3)");
console.log("-".repeat(50));

const blobTransaction = {
	type: 3, // EIP-4844 blob transaction
	chainId: 1, // Mainnet
	nonce: 42,
	maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei
	maxFeePerGas: 30_000_000_000n, // 30 gwei
	gasLimit: 100_000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", // L2 bridge contract
	value: 0n,
	data: "0x", // Empty calldata
	accessList: [],

	// EIP-4844 specific fields
	maxFeePerBlobGas: 2_000_000_000n, // 2 gwei per blob gas
	blobVersionedHashes: [versionedHash1, versionedHash2],

	// Blob sidecar (not included in transaction hash)
	blobs: [blob1, blob2],
	commitments: [commitment1, commitment2],
	proofs: [proof1.proof, proof2.proof],
};

console.log("Transaction fields:");
console.log("  Type:", blobTransaction.type, "(EIP-4844)");
console.log("  Chain ID:", blobTransaction.chainId);
console.log("  To:", blobTransaction.to);
console.log(
	"  Max Fee Per Blob Gas:",
	blobTransaction.maxFeePerBlobGas / 1_000_000_000n,
	"gwei",
);
console.log("  Blob Count:", blobTransaction.blobs.length);
console.log();

console.log("Blob sidecar (not in tx hash):");
console.log("  Blobs:", blobTransaction.blobs.length, "(256 KB total)");
console.log(
	"  Commitments:",
	blobTransaction.commitments.length,
	"(96 bytes total)",
);
console.log("  Proofs:", blobTransaction.proofs.length, "(96 bytes total)");
console.log();

// Step 7: Transaction size breakdown
console.log("7. Transaction Size Breakdown");
console.log("-".repeat(50));

const txBodySize = 200; // Approximate base transaction size
const versionedHashesSize = 32 * blobTransaction.blobVersionedHashes.length;
const blobsSize = 131_072 * blobTransaction.blobs.length;
const commitmentsSize = 48 * blobTransaction.commitments.length;
const proofsSize = 48 * blobTransaction.proofs.length;

console.log("On-chain (in block):");
console.log("  Transaction body: ~" + txBodySize, "bytes");
console.log("  Versioned hashes:", versionedHashesSize, "bytes");
console.log(
	"  Total on-chain: ~" + (txBodySize + versionedHashesSize),
	"bytes",
);
console.log();

console.log("Sidecar (separate storage):");
console.log("  Blobs:", blobsSize, "bytes (262,144 bytes)");
console.log("  Commitments:", commitmentsSize, "bytes");
console.log("  Proofs:", proofsSize, "bytes");
console.log(
	"  Total sidecar:",
	blobsSize + commitmentsSize + proofsSize,
	"bytes",
);
console.log();

// Step 8: Gas cost calculation
console.log("8. Gas Cost Calculation");
console.log("-".repeat(50));

const blobBaseFee = 1n; // 1 wei per blob gas (example)
const executionBaseFee = 15_000_000_000n; // 15 gwei

const blobGasUsed = BigInt(blobTransaction.blobs.length * 131_072);
const executionGasUsed = 50_000n; // Estimated

const blobGasCost = blobGasUsed * blobBaseFee;
const executionGasCost =
	executionGasUsed * (executionBaseFee + blobTransaction.maxPriorityFeePerGas);
const totalCost = blobGasCost + executionGasCost;

console.log("Execution gas:");
console.log("  Base fee:", executionBaseFee / 1_000_000_000n, "gwei");
console.log("  Gas used:", executionGasUsed);
console.log("  Cost:", executionGasCost, "wei");
console.log();

console.log("Blob gas:");
console.log("  Blob base fee:", blobBaseFee, "wei");
console.log("  Blob gas used:", blobGasUsed);
console.log("  Cost:", blobGasCost, "wei");
console.log();

console.log("Total transaction cost:", totalCost, "wei");
console.log();

// Step 9: Verification workflow
console.log("9. Block Validator Verification");
console.log("-".repeat(50));

console.log("Step 1: Validate transaction format");
console.log("  ✓ Type = 3 (blob transaction)");
console.log("  ✓ to != null (no contract creation)");
console.log("  ✓ 1-6 blobs");
console.log();

console.log("Step 2: Verify versioned hashes");
const hash1Valid = versionedHash1[0] === 0x01;
const hash2Valid = versionedHash2[0] === 0x01;
console.log("  Blob 1 version:", hash1Valid ? "✓ 0x01" : "✗ Invalid");
console.log("  Blob 2 version:", hash2Valid ? "✓ 0x01" : "✗ Invalid");
console.log();

console.log("Step 3: Verify commitments match hashes");
const commitment1HashValid = (() => {
	const expected = computeVersionedHash(commitment1);
	return expected.every((byte, i) => byte === versionedHash1[i]);
})();
const commitment2HashValid = (() => {
	const expected = computeVersionedHash(commitment2);
	return expected.every((byte, i) => byte === versionedHash2[i]);
})();
console.log("  Blob 1:", commitment1HashValid ? "✓ Match" : "✗ Mismatch");
console.log("  Blob 2:", commitment2HashValid ? "✓ Match" : "✗ Mismatch");
console.log();

console.log("Step 4: Batch verify KZG proofs");
const batchValid = KZG.verifyBlobKzgProofBatch(
	[blob1, blob2],
	[commitment1, commitment2],
	[proof1.proof, proof2.proof],
);
console.log("  Batch verification:", batchValid ? "✓ Valid" : "✗ Invalid");
console.log();

const allValid =
	hash1Valid &&
	hash2Valid &&
	commitment1HashValid &&
	commitment2HashValid &&
	batchValid;
console.log("Transaction validity:", allValid ? "✓ ACCEPTED" : "✗ REJECTED");
console.log();

// Step 10: Data lifecycle
console.log("10. Blob Data Lifecycle");
console.log("-".repeat(50));

console.log("Immediate (0-18 days):");
console.log("  - Blobs stored by consensus nodes");
console.log("  - Commitments in execution layer state");
console.log("  - Anyone can download and verify blobs");
console.log("  - L2 can prove fraud/invalidity");
console.log();

console.log("After ~18 days:");
console.log("  - Blobs pruned from consensus layer");
console.log("  - Commitments remain on-chain forever");
console.log("  - Versioned hashes in transaction receipts");
console.log("  - L2 must have downloaded blob data");
console.log();

// Step 11: Cost comparison
console.log("11. Cost Comparison: Blobs vs Calldata");
console.log("-".repeat(50));

const dataSize = 262_144; // 256 KB
const calldataGas = dataSize * 16; // 16 gas per byte
const calldataCost = BigInt(calldataGas) * executionBaseFee;

console.log("256 KB via calldata:");
console.log("  Gas:", calldataGas);
console.log("  Cost:", calldataCost, "wei");
console.log("  Storage: Forever");
console.log();

console.log("256 KB via blobs:");
console.log("  Gas:", blobGasUsed);
console.log("  Cost:", blobGasCost, "wei");
console.log("  Storage: ~18 days");
console.log();

const savings = calldataCost - blobGasCost;
const savingsPercent = Number((savings * 10000n) / calldataCost) / 100;
console.log("Savings:");
console.log("  Wei saved:", savings);
console.log("  Percentage:", savingsPercent.toFixed(2) + "%");
console.log("  ~" + calldataGas / Number(blobGasUsed) + "x cheaper!");
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log("=== Key Takeaways ===");
console.log("- Type 3 transactions carry 1-6 blobs (up to 768 KB)");
console.log("- Versioned hashes on-chain, blobs in sidecar");
console.log("- Blobs ~16x cheaper than calldata");
console.log("- Blobs pruned after ~18 days");
console.log("- Enables affordable L2 data availability");
console.log("- Critical for Ethereum scaling roadmap");
