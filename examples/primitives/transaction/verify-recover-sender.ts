/**
 * Transaction Signature Verification and Sender Recovery Example
 *
 * Demonstrates:
 * - Recovering sender address from transaction signature
 * - Verifying transaction signatures
 * - Checking if transaction is signed
 * - Understanding signature components (r, s, yParity/v)
 * - Batch signature verification
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const unsignedTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32), // All zeros = unsigned
	s: new Uint8Array(32), // All zeros = unsigned
};

const signedTx: Transaction.EIP1559 = {
	...unsignedTx,
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

try {
	Transaction.assertSigned(unsignedTx);
} catch (error) {}

try {
	Transaction.assertSigned(signedTx);
} catch (error) {}

// In real usage, you'd have a properly signed transaction
const exampleSignedTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(`0x${"12".repeat(32)}`),
	s: Hex.toBytes(`0x${"fe".repeat(32)}`),
};

const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 37n, // EIP-155: chainId=1, yParity=0
	r: Hex.toBytes(`0x${"12".repeat(32)}`),
	s: Hex.toBytes(`0x${"fe".repeat(32)}`),
};

function extractYParityFromV(v: bigint, chainId: bigint): number {
	// For EIP-155: v = chainId * 2 + 35 + yParity
	// yParity = (v - 35 - chainId * 2)
	if (v === 27n || v === 28n) {
		// Pre-EIP-155
		return Number(v - 27n);
	}
	return Number(v - 35n - chainId * 2n);
}

function calculateVFromYParity(yParity: number, chainId: bigint): bigint {
	// v = chainId * 2 + 35 + yParity
	return chainId * 2n + 35n + BigInt(yParity);
}

const chainId = 1n;
const yParity = 0;
const v = calculateVFromYParity(yParity, chainId);
const extractedYParity = extractYParityFromV(v, chainId);

const transactions: Transaction.EIP1559[] = [
	exampleSignedTx,
	{ ...exampleSignedTx, nonce: 1n },
	{ ...exampleSignedTx, nonce: 2n },
];

let validCount = 0;
let invalidCount = 0;

for (let i = 0; i < transactions.length; i++) {
	const tx = transactions[i];
	const isSigned = Transaction.isSigned(tx);

	if (isSigned) {
		validCount++;
	} else {
		invalidCount++;
	}
}

// secp256k1 curve order
const SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_N_DIV_2 = SECP256K1_N / 2n;

const eip7702Tx: Transaction.EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: Address.from("0x1234567890123456789012345678901234567890"),
			nonce: 0n,
			yParity: 0,
			r: Hex.toBytes(`0x${"aa".repeat(32)}`),
			s: Hex.toBytes(`0x${"bb".repeat(32)}`),
		},
	],
	yParity: 1,
	r: Hex.toBytes(`0x${"cc".repeat(32)}`),
	s: Hex.toBytes(`0x${"dd".repeat(32)}`),
};
