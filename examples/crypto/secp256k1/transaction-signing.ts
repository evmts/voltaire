/**
 * Transaction signing and verification
 *
 * Demonstrates:
 * - Legacy transaction signing (pre-EIP-1559)
 * - EIP-155 replay protection
 * - Transaction hash computation
 * - Sender recovery from transaction signature
 * - Transaction verification
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";

// Helper: Derive Ethereum address from public key
function deriveAddress(publicKey: Uint8Array): string {
	const hash = keccak256(publicKey);
	const addressBytes = hash.slice(12);
	return "0x" + Buffer.from(addressBytes).toString("hex");
}

// Helper: Simple transaction message (in production, use proper RLP encoding)
function createTransactionMessage(tx: {
	nonce: bigint;
	gasPrice: bigint;
	gasLimit: bigint;
	to: string;
	value: bigint;
	data: Uint8Array;
	chainId: bigint;
}): Uint8Array {
	// For demonstration, create a simple message (production would use RLP)
	const message = `nonce=${tx.nonce},gasPrice=${tx.gasPrice},gasLimit=${tx.gasLimit},to=${tx.to},value=${tx.value},chainId=${tx.chainId}`;
	return new TextEncoder().encode(message);
}

console.log("=== Transaction Signing ===\n");

// Generate keypair
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = deriveAddress(publicKey);

console.log("Signer address:", signerAddress);

// Create unsigned transaction
const unsignedTx = {
	nonce: 5n,
	gasPrice: 20_000_000_000n, // 20 Gwei
	gasLimit: 21_000n, // Standard transfer
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: new Uint8Array(),
	chainId: 1n, // Mainnet
};

console.log("\n=== Unsigned Transaction ===");
console.log("  Nonce:", unsignedTx.nonce);
console.log("  Gas Price:", unsignedTx.gasPrice, "wei (20 Gwei)");
console.log("  Gas Limit:", unsignedTx.gasLimit);
console.log("  To:", unsignedTx.to);
console.log("  Value:", unsignedTx.value, "wei (1 ETH)");
console.log("  Data: 0x");
console.log("  Chain ID:", unsignedTx.chainId, "(Mainnet)");

// Create transaction message
const txMessage = createTransactionMessage(unsignedTx);
console.log(
	"\nTransaction message:",
	Buffer.from(txMessage).toString("hex").slice(0, 64) + "...",
);

// Hash transaction
const txHash = keccak256(txMessage);
console.log("Transaction hash:", Buffer.from(txHash).toString("hex"));

// Sign transaction
const signature = Secp256k1.sign(txHash, privateKey);
console.log("\n=== Signature ===");
console.log("  r:", Buffer.from(signature.r).toString("hex"));
console.log("  s:", Buffer.from(signature.s).toString("hex"));
console.log("  v (raw):", signature.v);

// Apply EIP-155 v value: v = chainId * 2 + 35 + recovery_id
const recoveryId = signature.v - 27;
const eip155V = unsignedTx.chainId * 2n + 35n + BigInt(recoveryId);
console.log("  v (EIP-155):", eip155V, "(with chain ID)");

// Create signed transaction
const signedTx = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: Number(eip155V),
};

console.log("\n=== Signed Transaction ===");
console.log("Transaction is now ready for broadcast");

// Verify signature by recovering sender
console.log("\n=== Sender Recovery ===");

const recoveredPublicKey = Secp256k1.recoverPublicKey(signature, txHash);
const recoveredAddress = deriveAddress(recoveredPublicKey);

console.log("Recovered address:", recoveredAddress);
console.log(
	"Matches signer:",
	recoveredAddress === signerAddress ? "✓ Yes" : "✗ No",
);

// Demonstrate EIP-155 replay protection
console.log("\n=== EIP-155 Replay Protection ===");

const mainnetV = 1n * 2n + 35n + BigInt(recoveryId); // Chain ID 1
const sepoliaV = 11155111n * 2n + 35n + BigInt(recoveryId); // Chain ID 11155111

console.log("Same signature, different chains:");
console.log("  Mainnet v:", mainnetV);
console.log("  Sepolia v:", sepoliaV);
console.log("Different v values prevent replay attacks across chains");

// Demonstrate pre-EIP-155 (legacy)
console.log("\n=== Pre-EIP-155 (Legacy) ===");
const legacyV = signature.v; // 27 or 28
console.log("Legacy v:", legacyV, "(no chain ID protection)");
console.log("Vulnerable to replay attacks across chains");

// Transaction verification function
function verifyTransaction(
	tx: typeof signedTx,
	expectedSigner: string,
): boolean {
	try {
		// Reconstruct signing message
		const message = createTransactionMessage(tx);
		const hash = keccak256(message);

		// Extract signature (convert EIP-155 v back to recovery ID)
		const chainId = tx.chainId;
		const recoveryId = tx.v - Number(chainId * 2n + 35n);
		const sig = {
			r: tx.r,
			s: tx.s,
			v: recoveryId + 27,
		};

		// Recover signer
		const pubKey = Secp256k1.recoverPublicKey(sig, hash);
		const signer = deriveAddress(pubKey);

		return signer === expectedSigner;
	} catch {
		return false;
	}
}

console.log("\n=== Transaction Verification ===");
const isValid = verifyTransaction(signedTx, signerAddress);
console.log("Transaction valid:", isValid ? "✓ Yes" : "✗ No");

const isInvalid = verifyTransaction(
	signedTx,
	"0x0000000000000000000000000000000000000000",
);
console.log("Wrong signer:", isInvalid ? "✓ Valid" : "✗ Invalid (expected)");
