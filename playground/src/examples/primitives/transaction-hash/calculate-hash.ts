import { Address, Hash, Transaction } from "voltaire";
// EIP-1559 transaction
const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n, // 1 ETH
	data: new Uint8Array(),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};

const eip1559Hash = Transaction.hash(eip1559Tx);

// Legacy transaction
const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};

const legacyHash = Transaction.hash(legacyTx);

// Contract creation transaction
const contractTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 3000000n,
	to: null, // null = contract creation
	value: 0n,
	data: new Uint8Array([
		// Simple contract bytecode
		0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
	]),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32).fill(3),
	s: new Uint8Array(32).fill(4),
};

const contractHash = Transaction.hash(contractTx);

// Transaction with access list
const accessListTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 100000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]), // transfer() function selector
	accessList: [
		{
			address: Address("0x1234567890123456789012345678901234567890"),
			storageKeys: [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
		},
	],
	yParity: 1,
	r: new Uint8Array(32).fill(5),
	s: new Uint8Array(32).fill(6),
};

const accessListHash = Transaction.hash(accessListTx);
