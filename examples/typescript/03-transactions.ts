/**
 * Example 3: Transaction Encoding and Validation
 *
 * Demonstrates:
 * - Creating different transaction types
 * - Encoding transactions for signing
 * - Computing transaction hashes
 * - Validating transactions
 */

import {
	type Eip1559Transaction,
	type Eip7702Transaction,
	type LegacyTransaction,
	detectTransactionType,
	encodeEip1559ForSigning,
	encodeEip7702ForSigning,
	encodeLegacyForSigning,
	hashTransaction,
	validateTransaction,
} from "../../src/typescript/primitives/transaction";
const legacyTx: LegacyTransaction = {
	nonce: 0n,
	gasPrice: 20000000000n, // 20 gwei
	gasLimit: 21000n,
	to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
	value: 1000000000000000n, // 0.001 ETH
	data: "0x",
	v: 37n,
	r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
};

const legacyEncoded = encodeLegacyForSigning(legacyTx, 1n); // mainnet
const eip1559Tx: Eip1559Transaction = {
	type: "eip1559",
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n, // 2 gwei tip
	maxFeePerGas: 100000000000n, // 100 gwei max
	gasLimit: 21000n,
	to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
	value: 1000000000000000000n, // 1 ETH
	data: "0x",
	accessList: [],
	v: 1n,
	r: "0xc7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5",
	s: "0x6d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d",
};

const eip1559Encoded = encodeEip1559ForSigning(eip1559Tx);
const eip1559WithAccessList: Eip1559Transaction = {
	...eip1559Tx,
	accessList: [
		{
			address: "0x1111111111111111111111111111111111111111",
			storageKeys: [
				"0x0000000000000000000000000000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000000000000000000000000000002",
			],
		},
		{
			address: "0x2222222222222222222222222222222222222222",
			storageKeys: [
				"0x0000000000000000000000000000000000000000000000000000000000000003",
			],
		},
	],
};
const encodedWithAccess = encodeEip1559ForSigning(eip1559WithAccessList);
const eip7702Tx: Eip7702Transaction = {
	type: "eip7702",
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 50000n,
	to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
	value: 0n,
	data: "0x",
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: "0x1111111111111111111111111111111111111111",
			nonce: 0n,
			v: 27n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		},
	],
	v: 1n,
	r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
};

const eip7702Encoded = encodeEip7702ForSigning(eip7702Tx);
const contractCreation: LegacyTransaction = {
	nonce: 5n,
	gasPrice: 20000000000n,
	gasLimit: 3000000n, // Higher gas for contract creation
	to: undefined, // No 'to' address for creation
	value: 0n,
	data: "0x608060405234801561001057600080fd5b50...", // Contract bytecode
	v: 37n,
	r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
};
