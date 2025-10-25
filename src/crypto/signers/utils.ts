/**
 * Signer Utility Functions
 *
 * Provides utility functions for signature verification, recovery,
 * and general signer operations.
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { Address } from "../../primitives/address.ts";
import { hashMessage } from "../eip191.ts";
import { hashTypedData, type TypedMessage } from "../eip712.ts";
import type { Signer, Signature } from "./types.ts";
import { parseSignature } from "./types.ts";
import type { Transaction } from "../../primitives/transaction.ts";

/**
 * Sign a transaction with a signer
 * @param signer - Signer instance
 * @param transaction - Transaction to sign
 * @returns Signed transaction
 */
export async function sign(
	signer: Signer,
	transaction: Transaction,
): Promise<Transaction> {
	return signer.signTransaction(transaction);
}

/**
 * Sign a message with a signer (EIP-191)
 * @param signer - Signer instance
 * @param message - Message to sign
 * @returns Signature as 65-byte hex string
 */
export async function signMessage(
	signer: Signer,
	message: Uint8Array | string,
): Promise<string> {
	return signer.signMessage(message);
}

/**
 * Sign typed data with a signer (EIP-712)
 * @param signer - Signer instance
 * @param typedData - Typed data to sign
 * @returns Signature as 65-byte hex string
 */
export async function signTypedData(
	signer: Signer,
	typedData: TypedMessage,
): Promise<string> {
	return signer.signTypedData(typedData);
}

/**
 * Get the address from a signer
 * @param signer - Signer instance
 * @returns Ethereum address
 */
export function getAddress(signer: Signer): string {
	return signer.address;
}

/**
 * Verify a message signature
 * @param message - Original message
 * @param signature - Signature to verify
 * @param expectedAddress - Expected signer address
 * @returns true if signature is valid
 */
export function verifyMessage(
	message: Uint8Array | string,
	signature: string | Uint8Array,
	expectedAddress: string,
): boolean {
	try {
		const recoveredAddress = recoverMessageAddress(message, signature);
		return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
	} catch {
		return false;
	}
}

/**
 * Verify a typed data signature
 * @param typedData - Original typed data
 * @param signature - Signature to verify
 * @param expectedAddress - Expected signer address
 * @returns true if signature is valid
 */
export function verifyTypedData(
	typedData: TypedMessage,
	signature: string | Uint8Array,
	expectedAddress: string,
): boolean {
	try {
		const recoveredAddress = recoverTypedDataAddress(typedData, signature);
		return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
	} catch {
		return false;
	}
}

/**
 * Recover the address that signed a message
 * @param message - Original message
 * @param signature - Signature (65 bytes)
 * @returns Recovered Ethereum address
 */
export function recoverMessageAddress(
	message: Uint8Array | string,
	signature: string | Uint8Array,
): string {
	// Hash the message using EIP-191
	const messageHashHex = hashMessage(message);
	const messageHash = hexToBytes(messageHashHex);

	// Parse signature
	const sig = parseSignature(signature);

	// Recover public key
	const publicKey = recoverPublicKey(messageHash, sig);

	// Derive address from public key
	return publicKeyToAddress(publicKey);
}

/**
 * Recover the address that signed typed data
 * @param typedData - Original typed data
 * @param signature - Signature (65 bytes)
 * @returns Recovered Ethereum address
 */
export function recoverTypedDataAddress(
	typedData: TypedMessage,
	signature: string | Uint8Array,
): string {
	// Hash the typed data using EIP-712
	const dataHashHex = hashTypedData(typedData.domain, typedData);
	const dataHash = hexToBytes(dataHashHex);

	// Parse signature
	const sig = parseSignature(signature);

	// Recover public key
	const publicKey = recoverPublicKey(dataHash, sig);

	// Derive address from public key
	return publicKeyToAddress(publicKey);
}

/**
 * Recover the address that signed a transaction
 * @param transaction - Signed transaction
 * @returns Recovered Ethereum address
 */
export async function recoverTransactionAddress(
	transaction: Transaction,
): Promise<string> {
	const {
		encodeLegacyForSigning,
		encodeEip1559ForSigning,
		encodeEip7702ForSigning,
		fromHex,
	} = await import("../../primitives/transaction.ts");

	// Encode transaction for signing
	let encoded: string;

	if ("gasPrice" in transaction) {
		// Legacy transaction - need to extract chainId from v
		const chainId = transaction.v > 35n
			? (transaction.v - 35n) / 2n
			: 1n;

		// Create unsigned version for hashing
		const unsignedTx = { ...transaction, v: 0n };
		encoded = encodeLegacyForSigning(unsignedTx, chainId);
	} else if ("authorizationList" in transaction) {
		// EIP-7702
		const unsignedTx = { ...transaction, v: 0n };
		encoded = encodeEip7702ForSigning(unsignedTx);
	} else {
		// EIP-1559
		const unsignedTx = { ...transaction, v: 0n };
		encoded = encodeEip1559ForSigning(unsignedTx);
	}

	// Hash the encoded transaction
	const txBytes = fromHex(encoded);
	const messageHash = keccak_256(txBytes);

	// Parse signature from transaction
	const sig: Signature = {
		r: transaction.r,
		s: transaction.s,
		v: Number(transaction.v),
		compact: "",
	};

	// Adjust v for recovery (handle EIP-155)
	if ("gasPrice" in transaction && sig.v > 35) {
		// EIP-155: v = chainId * 2 + 35 + recovery
		const chainId = (sig.v - 35) / 2;
		sig.v = sig.v - (chainId * 2 + 35);
	}

	// Recover public key
	const publicKey = recoverPublicKey(messageHash, sig);

	// Derive address from public key
	return publicKeyToAddress(publicKey);
}

/**
 * Recover public key from signature
 * @param messageHash - Hash that was signed
 * @param signature - Parsed signature
 * @returns Recovered public key (64 bytes, uncompressed without prefix)
 */
function recoverPublicKey(messageHash: Uint8Array, signature: Signature): Uint8Array {
	// Normalize recovery id
	let recovery = signature.v;
	if (recovery >= 27) recovery -= 27;
	if (recovery > 1) {
		throw new Error(`Invalid recovery id: ${signature.v}`);
	}

	// Parse r and s
	const r = BigInt(signature.r);
	const s = BigInt(signature.s);

	// Create signature object for noble/curves
	const sig = new secp256k1.Signature(r, s);
	sig.addRecoveryBit(recovery);

	// Recover public key
	const publicKey = sig.recoverPublicKey(messageHash);

	// Return uncompressed public key without prefix (64 bytes)
	const publicKeyBytes = publicKey.toRawBytes(false);
	return publicKeyBytes.slice(1); // Remove 0x04 prefix
}

/**
 * Convert public key to Ethereum address
 * @param publicKey - Public key (64 bytes, uncompressed)
 * @returns Ethereum address (checksummed)
 */
function publicKeyToAddress(publicKey: Uint8Array): string {
	if (publicKey.length !== 64) {
		throw new Error("Public key must be 64 bytes");
	}

	// Hash with Keccak-256
	const hash = keccak_256(publicKey);

	// Take last 20 bytes
	const addressBytes = hash.slice(-20);

	// Convert to Address for checksumming
	const addr = new Address(addressBytes);
	return addr.toChecksumHex();
}

/**
 * Check if a signature is canonical (low-s value)
 * Non-canonical signatures are malleable and should be rejected
 * @param signature - Signature to check
 * @returns true if signature is canonical
 */
export function isCanonicalSignature(signature: string | Uint8Array): boolean {
	const sig = parseSignature(signature);
	const s = BigInt(sig.s);

	// secp256k1 curve order
	const n = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");

	// Canonical signature has s <= n/2
	return s <= n / 2n;
}

/**
 * Normalize signature to canonical form (low-s)
 * @param signature - Signature to normalize
 * @returns Normalized signature
 */
export function normalizeSignature(signature: string | Uint8Array): string {
	const sig = parseSignature(signature);

	if (isCanonicalSignature(signature)) {
		return sig.compact;
	}

	// Flip s value: s' = n - s
	const s = BigInt(sig.s);
	const n = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
	const sNormalized = n - s;

	// Flip recovery id
	const vNormalized = sig.v ^ 1;

	// Reconstruct signature
	const sHex = sNormalized.toString(16).padStart(64, "0");
	const vHex = vNormalized.toString(16).padStart(2, "0");

	return `0x${sig.r.slice(2)}${sHex}${vHex}`;
}

// Helper functions
function hexToBytes(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length % 2 !== 0) {
		throw new Error("Invalid hex string: odd length");
	}

	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}
