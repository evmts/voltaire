/**
 * Transaction Signing and Hashing Example
 *
 * Demonstrates:
 * - Computing transaction hashes
 * - Computing signing hashes
 * - Sender recovery from signatures
 * - Signature verification
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const signedTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(
		"0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276",
	),
	s: Hex.toBytes(
		"0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
	),
};

// Transaction hash (includes signature)
const txHash = Transaction.hash(signedTx);

// Signing hash (excludes signature)
const signingHash = Transaction.getSigningHash(signedTx);

// Check if signed
const isSigned = Transaction.isSigned(signedTx);

if (isSigned) {
	try {
		// Recover sender from signature
		const sender = Transaction.getSender(signedTx);
	} catch (error) {}
}

const validTx = signedTx;
const isValid = Transaction.verifySignature(validTx);

// Create invalid transaction (wrong signature)
const invalidTx: Transaction.EIP1559 = {
	...signedTx,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};
const isInvalid = Transaction.isSigned(invalidTx);

const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 37n, // chainId=1, yParity=0
	r: Hex.toBytes(
		"0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276",
	),
	s: Hex.toBytes(
		"0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
	),
};
const chainId = Transaction.Legacy.getChainId.call(legacyTx);

// yParity extraction
const yParity = Number(legacyTx.v % 2n);

// Legacy signing hash (EIP-155)
const legacySigningHash = Transaction.getSigningHash(legacyTx);

// EIP-1559 signing hash
const eip1559SigningHash = Transaction.getSigningHash(signedTx);

function validatePoolTransaction(tx: Transaction.Any): {
	valid: boolean;
	error?: string;
} {
	// Check if signed
	if (!Transaction.isSigned(tx)) {
		return { valid: false, error: "Transaction not signed" };
	}

	// Verify signature
	if (!Transaction.verifySignature(tx)) {
		return { valid: false, error: "Invalid signature" };
	}

	// Check chain ID matches
	const txChainId = Transaction.getChainId(tx);
	const expectedChainId = 1n;
	if (txChainId !== expectedChainId) {
		return {
			valid: false,
			error: `Wrong chain: expected ${expectedChainId}, got ${txChainId}`,
		};
	}

	return { valid: true };
}
const result = validatePoolTransaction(signedTx);
if (result.error) {
}

try {
	Transaction.assertSigned(signedTx);

	const sender = Transaction.getSender(signedTx);
} catch (error) {}

const tx1 = signedTx;
const tx2 = { ...signedTx, nonce: 1n }; // Different nonce

const hash1 = Transaction.hash(tx1);
const hash2 = Transaction.hash(tx2);
