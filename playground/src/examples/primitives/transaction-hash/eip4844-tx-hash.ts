import { Address, Bytes, Bytes32, Hash, Transaction } from "@tevm/voltaire";
const blobTx: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 5n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 30000000000n,
	maxFeePerBlobGas: 1000000000n, // Blob-specific gas fee
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: Bytes.zero(0),
	accessList: [],
	blobVersionedHashes: [
		Bytes32.zero().fill(1), // Commitment to blob data
	],
	yParity: 1,
	r: Bytes32.zero().fill(2),
	s: Bytes32.zero().fill(3),
};
const multiBlob: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 10n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 40000000000n,
	maxFeePerBlobGas: 2000000000n,
	gasLimit: 50000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: Bytes([0xa9, 0x05, 0x9c, 0xbb]),
	accessList: [],
	blobVersionedHashes: [
		Bytes32.zero().fill(1),
		Bytes32.zero().fill(2),
		Bytes32.zero().fill(3),
	],
	yParity: 0,
	r: Bytes32.zero().fill(4),
	s: Bytes32.zero().fill(5),
};
const expensiveBlob: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 15n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 30000000000n,
	maxFeePerBlobGas: 10000000000n, // 10 gwei per blob gas (high)
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: Bytes.zero(0),
	accessList: [],
	blobVersionedHashes: [Bytes32.zero().fill(6)],
	yParity: 1,
	r: Bytes32.zero().fill(7),
	s: Bytes32.zero().fill(8),
};
const blobWithAccessList: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 20n,
	maxPriorityFeePerGas: 1500000000n,
	maxFeePerGas: 35000000000n,
	maxFeePerBlobGas: 1500000000n,
	gasLimit: 100000n,
	to: Address("0x6b175474e89094c44da98b954eedeac495271d0f"),
	value: 0n,
	data: Bytes([0xa9, 0x05, 0x9c, 0xbb]),
	accessList: [
		{
			address: Address("0x6b175474e89094c44da98b954eedeac495271d0f"),
			storageKeys: [Bytes32.zero().fill(0)],
		},
	],
	blobVersionedHashes: [Bytes32.zero().fill(9), Bytes32.zero().fill(10)],
	yParity: 0,
	r: Bytes32.zero().fill(11),
	s: Bytes32.zero().fill(12),
};
const blobGasPerBlob = 131072n; // Fixed: 2^17
const totalBlobGas = blobGasPerBlob * BigInt(blobTx.blobVersionedHashes.length);
