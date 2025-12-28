import { Address, Bytes, Bytes32, Hash, Transaction } from "@tevm/voltaire";
// EIP-4844 Transaction: Blob transactions for L2 data availability

// Create EIP-4844 blob transaction (for L2 rollups)
const eip4844: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"), // Must be contract
	value: 0n,
	data: Bytes.zero(0),
	accessList: [],
	maxFeePerBlobGas: 1_000_000_000n, // Max willing to pay per blob gas
	blobVersionedHashes: [
		Hash(`0x01${"00".repeat(31)}`), // KZG commitment hash for blob 1
		Hash(`0x01${"11".repeat(31)}`), // KZG commitment hash for blob 2
	],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// Get blob count
const blobCount = Transaction.getBlobCount(eip4844);

// Get blob versioned hashes
const hashes = Transaction.getBlobVersionedHashes(eip4844);

// Calculate blob gas cost
// Each blob is 128 KB (131,072 bytes)
const blobGasPerBlob = 131_072;
const blobBaseFee = 1n; // From block header
const blobGasCost = BigInt(blobCount) * BigInt(blobGasPerBlob) * blobBaseFee;

// Total cost = execution cost + blob cost + value
const executionCost = eip4844.maxFeePerGas * eip4844.gasLimit;
const totalMaxCost = executionCost + blobGasCost + eip4844.value;
