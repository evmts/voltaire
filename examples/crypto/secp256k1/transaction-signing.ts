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
	return `0x${Buffer.from(addressBytes).toString("hex")}`;
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

// Generate keypair
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = deriveAddress(publicKey);

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

// Create transaction message
const txMessage = createTransactionMessage(unsignedTx);

// Hash transaction
const txHash = keccak256(txMessage);

// Sign transaction
const signature = Secp256k1.sign(txHash, privateKey);

// Apply EIP-155 v value: v = chainId * 2 + 35 + recovery_id
const recoveryId = signature.v - 27;
const eip155V = unsignedTx.chainId * 2n + 35n + BigInt(recoveryId);

// Create signed transaction
const signedTx = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: Number(eip155V),
};

const recoveredPublicKey = Secp256k1.recoverPublicKey(signature, txHash);
const recoveredAddress = deriveAddress(recoveredPublicKey);

const mainnetV = 1n * 2n + 35n + BigInt(recoveryId); // Chain ID 1
const sepoliaV = 11155111n * 2n + 35n + BigInt(recoveryId); // Chain ID 11155111
const legacyV = signature.v; // 27 or 28

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
const isValid = verifyTransaction(signedTx, signerAddress);

const isInvalid = verifyTransaction(
	signedTx,
	"0x0000000000000000000000000000000000000000",
);
