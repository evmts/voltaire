import { Address, Hash, Transaction } from "voltaire";
const preEip155: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 27n, // Pre-EIP-155: v = 27 or 28
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};
const eip155Mainnet: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 37n, // EIP-155 mainnet: v = 35 + chainId*2 + {0,1} = 37 or 38
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};
const eip155Sepolia: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 22310259n, // 35 + 11155111*2 + 1 = 22310259
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};
const deployment: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 3000000n,
	to: null, // Contract creation
	value: 0n,
	data: new Uint8Array([
		// Contract bytecode
		0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x10, 0x57, 0x60,
		0x00, 0x80, 0xfd,
	]),
	v: 27n,
	r: new Uint8Array(32).fill(3),
	s: new Uint8Array(32).fill(4),
};
const functionCall: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 5n,
	gasPrice: 25000000000n,
	gasLimit: 100000n,
	to: Address("0x6b175474e89094c44da98b954eedeac495271d0f"), // DAI contract
	value: 0n,
	data: new Uint8Array([
		0xa9,
		0x05,
		0x9c,
		0xbb, // transfer(address,uint256) selector
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x00,
		0x74,
		0x2d,
		0x35,
		0xcc,
		0x66,
		0x34,
		0xc0,
		0x53,
		0x29,
		0x25,
		0xa3,
		0xb8,
		0x44,
		0xbc,
		0x9e,
		0x75,
		0x95,
		0xf0,
		0xbe,
		0xb0, // recipient
	]),
	v: 37n,
	r: new Uint8Array(32).fill(5),
	s: new Uint8Array(32).fill(6),
};
const hash1 = Transaction.hash(preEip155);
const hash2 = Transaction.hash(preEip155);
