import { Address, Hash, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: Bytes.zero(0),
	v: 27n,
	r: Bytes32.zero().fill(1),
	s: Bytes32.zero().fill(2),
};
const eip2930Tx: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: Bytes.zero(0),
	accessList: [
		{
			address: Address("0x1234567890123456789012345678901234567890"),
			storageKeys: [Bytes32.zero().fill(1)],
		},
	],
	yParity: 0,
	r: Bytes32.zero().fill(3),
	s: Bytes32.zero().fill(4),
};
const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: Bytes.zero(0),
	accessList: [],
	yParity: 1,
	r: Bytes32.zero().fill(5),
	s: Bytes32.zero().fill(6),
};
const eip4844Tx: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 30000000000n,
	maxFeePerBlobGas: 1000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: Bytes.zero(0),
	accessList: [],
	blobVersionedHashes: [Bytes32.zero().fill(1)],
	yParity: 0,
	r: Bytes32.zero().fill(7),
	s: Bytes32.zero().fill(8),
};
const hashes = [
	{ type: "Legacy", hash: Transaction.hash(legacyTx) },
	{ type: "EIP-2930", hash: Transaction.hash(eip2930Tx) },
	{ type: "EIP-1559", hash: Transaction.hash(eip1559Tx) },
	{ type: "EIP-4844", hash: Transaction.hash(eip4844Tx) },
];
for (const { type, hash } of hashes) {
}
