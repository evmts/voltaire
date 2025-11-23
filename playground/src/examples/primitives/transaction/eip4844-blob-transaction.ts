// EIP-4844 Transaction: Blob transactions for L2 data availability
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hash from "../../../primitives/Hash/index.js";

// Create EIP-4844 blob transaction (for L2 rollups)
const eip4844: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"), // Must be contract
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	maxFeePerBlobGas: 1_000_000_000n, // Max willing to pay per blob gas
	blobVersionedHashes: [
		Hash.from("0x01" + "00".repeat(31)), // KZG commitment hash for blob 1
		Hash.from("0x01" + "11".repeat(31)), // KZG commitment hash for blob 2
	],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("Transaction type:", eip4844.type);
console.log("Max fee per blob gas:", eip4844.maxFeePerBlobGas);

// Get blob count
const blobCount = Transaction.getBlobCount(eip4844);
console.log("Blob count:", blobCount);

// Get blob versioned hashes
const hashes = Transaction.getBlobVersionedHashes(eip4844);
console.log("Blob hashes:", hashes.length);

// Calculate blob gas cost
// Each blob is 128 KB (131,072 bytes)
const blobGasPerBlob = 131_072;
const blobBaseFee = 1n; // From block header
const blobGasCost = BigInt(blobCount) * BigInt(blobGasPerBlob) * blobBaseFee;
console.log("Blob gas cost (wei):", blobGasCost);

// Total cost = execution cost + blob cost + value
const executionCost = eip4844.maxFeePerGas * eip4844.gasLimit;
const totalMaxCost = executionCost + blobGasCost + eip4844.value;
console.log("Total max cost (wei):", totalMaxCost);
