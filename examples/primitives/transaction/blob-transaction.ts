/**
 * EIP-4844 Blob Transaction Example
 *
 * Demonstrates blob transactions for L2 data availability:
 * - Creating blob transactions
 * - Blob gas cost calculation
 * - Blob versioned hashes (KZG commitments)
 * - Cost comparison with calldata
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

// Create blob versioned hashes (KZG commitments)
const blobHash1 = Hash.from(
	"0x0100000000000000000000000000000000000000000000000000000000000001",
);
const blobHash2 = Hash.from(
	"0x0100000000000000000000000000000000000000000000000000000000000002",
);

const blobTx: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), // Cannot be null
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	maxFeePerBlobGas: 2_000_000_000n, // 2 gwei per blob gas
	blobVersionedHashes: [blobHash1, blobHash2], // 2 blobs
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const BLOB_SIZE = 131_072n; // 128 KB per blob
const BLOB_GAS_PER_BLOB = 131_072n;
const blobCount = Transaction.getBlobCount(blobTx);
const totalBlobSize = BLOB_SIZE * BigInt(blobCount);
const totalBlobGas = BLOB_GAS_PER_BLOB * BigInt(blobCount);

const blobBaseFee = 1n; // 1 wei per blob gas (example)
const blobGasCost = Transaction.EIP4844.getBlobGasCost(blobTx, blobBaseFee);

const baseFee = 15_000_000_000n; // Execution base fee
const gasUsed = 50_000n;

const executionGasPrice = Transaction.EIP4844.getEffectiveGasPrice(
	blobTx,
	baseFee,
);
const executionCost = executionGasPrice * gasUsed;
const totalCost = executionCost + blobGasCost + blobTx.value;

const dataSize = 131_072n; // 128 KB

// Calldata cost (16 gas per byte)
const calldataGasPerByte = 16n;
const calldataGasCost = dataSize * calldataGasPerByte;
const calldataCostWei = calldataGasCost * baseFee;

// Blob cost (1 gas per byte, approximately)
const blobGasPerByte = 1n;
const blobGasCostForData = dataSize * blobGasPerByte * blobBaseFee;

const savings = calldataCostWei - blobGasCostForData;
const savingsPercent = (Number(savings) / Number(calldataCostWei)) * 100;

for (let i = 0; i < blobTx.blobVersionedHashes.length; i++) {
	const versionedHash = blobTx.blobVersionedHashes[i];
	const hashBytes = new Uint8Array(versionedHash);
	const version = hashBytes[0];
}

const scenarios = [
	{ blobs: 1, description: "Low usage" },
	{ blobs: 3, description: "Target (equilibrium)" },
	{ blobs: 5, description: "High usage" },
	{ blobs: 6, description: "Maximum" },
];
for (const scenario of scenarios) {
	const adjustment =
		scenario.blobs < 3
			? "↓ Decrease"
			: scenario.blobs > 3
				? "↑ Increase"
				: "→ Stable";
}
