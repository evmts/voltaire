/**
 * Transaction Signing and Hashing Example
 *
 * Demonstrates:
 * - Computing transaction hashes
 * - Computing signing hashes
 * - Sender recovery from signatures
 * - Signature verification
 */

import * as Transaction from "../../../src/primitives/Transaction/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

console.log("=== Transaction Signing and Hashing Examples ===\n");

// Example 1: Transaction hash vs signing hash
console.log("1. Transaction Hash vs Signing Hash");
console.log("-".repeat(50));

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
console.log("Transaction Hash (includes signature):");
console.log("  Hash:", Hex.fromBytes(txHash));
console.log("  Used for: Unique transaction identifier");
console.log("  Includes: All fields including r, s, yParity");
console.log();

// Signing hash (excludes signature)
const signingHash = Transaction.getSigningHash(signedTx);
console.log("Signing Hash (excludes signature):");
console.log("  Hash:", Hex.fromBytes(signingHash));
console.log("  Used for: Creating/verifying signatures");
console.log("  Includes: All fields EXCEPT r, s, yParity");
console.log("  This is what gets signed by the private key");
console.log();

// Example 2: Sender recovery
console.log("2. Sender Recovery from Signature");
console.log("-".repeat(50));

console.log("Transaction signed by unknown sender...");
console.log();

// Check if signed
const isSigned = Transaction.isSigned(signedTx);
console.log("Is Signed:", isSigned);

if (isSigned) {
	try {
		// Recover sender from signature
		const sender = Transaction.getSender(signedTx);
		console.log("Recovered Sender:", Address.toHex(sender));
		console.log("Checksummed:", Address.toChecksummed(sender));
	} catch (error) {
		console.log("Sender recovery failed:", (error as Error).message);
	}
}
console.log();

// Example 3: Signature verification
console.log("3. Signature Verification");
console.log("-".repeat(50));

const validTx = signedTx;
console.log("Valid Transaction:");
const isValid = Transaction.verifySignature(validTx);
console.log("  Signature Valid:", isValid ? "✓" : "✗");
console.log();

// Create invalid transaction (wrong signature)
const invalidTx: Transaction.EIP1559 = {
	...signedTx,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Invalid Transaction (zero signature):");
const isInvalid = Transaction.isSigned(invalidTx);
console.log("  Is Signed:", isInvalid);
console.log("  r:", Hex.fromBytes(invalidTx.r));
console.log("  s:", Hex.fromBytes(invalidTx.s));
console.log();

// Example 4: Legacy transaction chain ID extraction
console.log("4. Legacy Transaction Chain ID");
console.log("-".repeat(50));

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

console.log("Legacy Transaction:");
console.log("  v value:", legacyTx.v);
const chainId = Transaction.Legacy.getChainId.call(legacyTx);
console.log("  Extracted Chain ID:", chainId);
console.log(
	"  Formula: (v - 35) / 2 = (" + legacyTx.v + " - 35) / 2 = " + chainId,
);
console.log();

// yParity extraction
const yParity = Number(legacyTx.v % 2n);
console.log("  yParity:", yParity);
console.log("  Formula: v % 2 = " + legacyTx.v + " % 2 = " + yParity);
console.log();

// Example 5: Signing hash for different transaction types
console.log("5. Signing Hash Structure");
console.log("-".repeat(50));

// Legacy signing hash (EIP-155)
const legacySigningHash = Transaction.getSigningHash(legacyTx);
console.log("Legacy (EIP-155):");
console.log("  Hash:", Hex.fromBytes(legacySigningHash));
console.log("  Structure: keccak256(rlp([nonce, gasPrice, gasLimit, to,");
console.log("                             value, data, chainId, 0, 0]))");
console.log("  Note: Includes chainId for replay protection");
console.log();

// EIP-1559 signing hash
const eip1559SigningHash = Transaction.getSigningHash(signedTx);
console.log("EIP-1559:");
console.log("  Hash:", Hex.fromBytes(eip1559SigningHash));
console.log(
	"  Structure: keccak256(0x02 || rlp([chainId, nonce, maxPriorityFee,",
);
console.log("                                    maxFee, gasLimit, to, value,");
console.log("                                    data, accessList]))");
console.log("  Note: Type prefix + RLP, no signature fields");
console.log();

// Example 6: Transaction pool validation pattern
console.log("6. Transaction Pool Validation Pattern");
console.log("-".repeat(50));

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

console.log("Validating transaction for pool:");
const result = validatePoolTransaction(signedTx);
console.log("  Valid:", result.valid ? "✓" : "✗");
if (result.error) {
	console.log("  Error:", result.error);
}
console.log();

// Example 7: Assert signed pattern
console.log("7. Assert Signed Pattern");
console.log("-".repeat(50));

try {
	Transaction.assertSigned(signedTx);
	console.log("Transaction is signed ✓");

	const sender = Transaction.getSender(signedTx);
	console.log("Safe to get sender:", Address.toHex(sender));
} catch (error) {
	console.log("Error:", (error as Error).message);
}
console.log();

// Example 8: Transaction uniqueness
console.log("8. Transaction Uniqueness");
console.log("-".repeat(50));

const tx1 = signedTx;
const tx2 = { ...signedTx, nonce: 1n }; // Different nonce

const hash1 = Transaction.hash(tx1);
const hash2 = Transaction.hash(tx2);

console.log("Transaction 1 Hash:", Hex.fromBytes(hash1));
console.log("Transaction 2 Hash:", Hex.fromBytes(hash2));
console.log("Hashes Equal:", Hex.fromBytes(hash1) === Hex.fromBytes(hash2));
console.log();
console.log("Transaction hash uniquely identifies:");
console.log("  - Sender (recovered from signature)");
console.log("  - Nonce (prevents replay)");
console.log("  - All transaction data");
console.log("  - Signature (proves authorization)");
