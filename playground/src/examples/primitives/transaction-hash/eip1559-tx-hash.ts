import { Address } from "../../../primitives/Address/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Transaction from "../../../primitives/Transaction/index.js";
const basicTransfer: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n, // 2 gwei priority fee
	maxFeePerGas: 30000000000n, // 30 gwei max fee
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n, // 1 ETH
	data: new Uint8Array(),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};
const withAccessList: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 10n,
	maxPriorityFeePerGas: 1500000000n,
	maxFeePerGas: 25000000000n,
	gasLimit: 100000n,
	to: Address("0x6b175474e89094c44da98b954eedeac495271d0f"), // DAI
	value: 0n,
	data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]), // transfer()
	accessList: [
		{
			address: Address("0x6b175474e89094c44da98b954eedeac495271d0f"),
			storageKeys: [
				new Uint8Array(32).fill(0), // balance slot
				new Uint8Array(32).fill(1), // allowance slot
			],
		},
	],
	yParity: 0,
	r: new Uint8Array(32).fill(3),
	s: new Uint8Array(32).fill(4),
};
const highPriority: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 50000000000n, // 50 gwei priority (very high)
	maxFeePerGas: 100000000000n, // 100 gwei max fee
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(5),
	s: new Uint8Array(32).fill(6),
};
const deployment: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 3000000n,
	to: null, // Contract creation
	value: 0n,
	data: new Uint8Array([
		0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x10, 0x57, 0x60,
		0x00, 0x80, 0xfd, 0x5b, 0x50, 0x60, 0x40, 0x51,
	]),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32).fill(7),
	s: new Uint8Array(32).fill(8),
};
const zeroValue: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 100n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 50000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 0n,
	data: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(9),
	s: new Uint8Array(32).fill(10),
};
