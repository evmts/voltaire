/**
 * EIP-7702 Authorization Transaction Example
 *
 * Demonstrates EOA delegation allowing externally-owned accounts
 * to temporarily execute as smart contracts:
 * - Creating authorization signatures
 * - Batched operations
 * - Social recovery patterns
 * - Gas abstraction
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const authorization: Transaction.Authorization = {
	chainId: 1n,
	address: Address.from("0x1111111111111111111111111111111111111111"), // Smart wallet contract
	nonce: 0n, // EOA nonce when signing authorization
	yParity: 0,
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

const eip7702Tx: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 0n,
	data: Hex.toBytes(`0xa9059cbb${"00".repeat(64)}`), // Contract call data
	accessList: [],
	authorizationList: [authorization],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const batchWalletAddress = Address.from(
	"0x2222222222222222222222222222222222222222",
);

const batchAuth: Transaction.Authorization = {
	chainId: 1n,
	address: batchWalletAddress, // Contract with executeBatch() function
	nonce: 0n,
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const multiAuthTx: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 200_000n,
	to: null,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: Address.from("0x1111111111111111111111111111111111111111"),
			nonce: 5n,
			yParity: 0,
			r: Hex.toBytes(`0x${"00".repeat(32)}`),
			s: Hex.toBytes(`0x${"00".repeat(32)}`),
		},
		{
			chainId: 1n,
			address: Address.from("0x2222222222222222222222222222222222222222"),
			nonce: 10n,
			yParity: 1,
			r: Hex.toBytes(`0x${"00".repeat(32)}`),
			s: Hex.toBytes(`0x${"00".repeat(32)}`),
		},
	],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};
for (let i = 0; i < multiAuthTx.authorizationList.length; i++) {
	const auth = multiAuthTx.authorizationList[i];
}

const recoveryContractAddr = Address.from(
	"0x3333333333333333333333333333333333333333",
);

const gaslessContractAddr = Address.from(
	"0x4444444444444444444444444444444444444444",
);

const spendingLimitAddr = Address.from(
	"0x5555555555555555555555555555555555555555",
);
