import { Address } from "../../../primitives/Address/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Transaction from "../../../primitives/Transaction/index.js";
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
	data: new Uint8Array(),
	accessList: [],
	blobVersionedHashes: [
		new Uint8Array(32).fill(1), // Commitment to blob data
	],
	yParity: 1,
	r: new Uint8Array(32).fill(2),
	s: new Uint8Array(32).fill(3),
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
	data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
	accessList: [],
	blobVersionedHashes: [
		new Uint8Array(32).fill(1),
		new Uint8Array(32).fill(2),
		new Uint8Array(32).fill(3),
	],
	yParity: 0,
	r: new Uint8Array(32).fill(4),
	s: new Uint8Array(32).fill(5),
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
	data: new Uint8Array(),
	accessList: [],
	blobVersionedHashes: [new Uint8Array(32).fill(6)],
	yParity: 1,
	r: new Uint8Array(32).fill(7),
	s: new Uint8Array(32).fill(8),
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
	data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
	accessList: [
		{
			address: Address("0x6b175474e89094c44da98b954eedeac495271d0f"),
			storageKeys: [new Uint8Array(32).fill(0)],
		},
	],
	blobVersionedHashes: [
		new Uint8Array(32).fill(9),
		new Uint8Array(32).fill(10),
	],
	yParity: 0,
	r: new Uint8Array(32).fill(11),
	s: new Uint8Array(32).fill(12),
};
const blobGasPerBlob = 131072n; // Fixed: 2^17
const totalBlobGas = blobGasPerBlob * BigInt(blobTx.blobVersionedHashes.length);
