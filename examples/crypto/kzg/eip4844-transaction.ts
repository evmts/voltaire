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
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

// Initialize KZG
KZG.loadTrustedSetup();

// Simulate L2 sequencer batching transactions
const rollupBatch1 = "Batch of 1000 L2 transactions compressed...";
const rollupBatch2 = "Another batch of 1000 L2 transactions...";

// Create blobs and fill with simulated data
const blob1 = KZG.createEmptyBlob();
const blob2 = KZG.createEmptyBlob();

// In real scenario: encode compressed rollup data into blob field elements
// For demo: use random valid blob data
const tempBlob1 = KZG.generateRandomBlob();
const tempBlob2 = KZG.generateRandomBlob();
blob1.set(tempBlob1);
blob2.set(tempBlob2);

const commitment1 = KZG.blobToKzgCommitment(blob1);
const commitment2 = KZG.blobToKzgCommitment(blob2);

function computeVersionedHash(commitment: Uint8Array): Uint8Array {
	const hash = SHA256.hash(commitment);
	hash[0] = 0x01; // Version byte for EIP-4844
	return hash;
}

const versionedHash1 = computeVersionedHash(commitment1);
const versionedHash2 = computeVersionedHash(commitment2);

// Random challenge point (in production, this would be derived from block hash)
const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0;

const proof1 = KZG.computeKzgProof(blob1, z);
const proof2 = KZG.computeKzgProof(blob2, z);

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

const txBodySize = 200; // Approximate base transaction size
const versionedHashesSize = 32 * blobTransaction.blobVersionedHashes.length;
const blobsSize = 131_072 * blobTransaction.blobs.length;
const commitmentsSize = 48 * blobTransaction.commitments.length;
const proofsSize = 48 * blobTransaction.proofs.length;

const blobBaseFee = 1n; // 1 wei per blob gas (example)
const executionBaseFee = 15_000_000_000n; // 15 gwei

const blobGasUsed = BigInt(blobTransaction.blobs.length * 131_072);
const executionGasUsed = 50_000n; // Estimated

const blobGasCost = blobGasUsed * blobBaseFee;
const executionGasCost =
	executionGasUsed * (executionBaseFee + blobTransaction.maxPriorityFeePerGas);
const totalCost = blobGasCost + executionGasCost;
const hash1Valid = versionedHash1[0] === 0x01;
const hash2Valid = versionedHash2[0] === 0x01;
const commitment1HashValid = (() => {
	const expected = computeVersionedHash(commitment1);
	return expected.every((byte, i) => byte === versionedHash1[i]);
})();
const commitment2HashValid = (() => {
	const expected = computeVersionedHash(commitment2);
	return expected.every((byte, i) => byte === versionedHash2[i]);
})();
const batchValid = KZG.verifyBlobKzgProofBatch(
	[blob1, blob2],
	[commitment1, commitment2],
	[proof1.proof, proof2.proof],
);

const allValid =
	hash1Valid &&
	hash2Valid &&
	commitment1HashValid &&
	commitment2HashValid &&
	batchValid;

const dataSize = 262_144; // 256 KB
const calldataGas = dataSize * 16; // 16 gas per byte
const calldataCost = BigInt(calldataGas) * executionBaseFee;

const savings = calldataCost - blobGasCost;
const savingsPercent = Number((savings * 10000n) / calldataCost) / 100;

// Cleanup
KZG.freeTrustedSetup();
