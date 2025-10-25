/**
 * Private Key Signer Implementation
 *
 * Signs transactions and messages using a raw private key.
 * Uses @noble/curves for secp256k1 operations (well-audited, pure TypeScript).
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/legacy";
import type { Transaction } from "../../primitives/transaction.ts";
import { Address } from "../../primitives/address.ts";
import { hashMessage } from "../eip191.ts";
import { hashTypedData, type TypedMessage } from "../eip712.ts";
import type { PrivateKeySigner, PrivateKeySignerOptions, Signature } from "./types.ts";
import { serializeSignature } from "./types.ts";

/**
 * Private key signer implementation
 */
export class PrivateKeySignerImpl implements PrivateKeySigner {
	readonly type = "privateKey" as const;
	private readonly privateKeyBytes: Uint8Array;
	readonly address: string;

	private constructor(privateKey: Uint8Array) {
		if (privateKey.length !== 32) {
			throw new Error("Private key must be exactly 32 bytes");
		}
		this.privateKeyBytes = privateKey;
		this.address = this.deriveAddress();
	}

	/**
	 * Create a signer from a private key
	 * @param options - Private key options
	 * @returns Private key signer instance
	 */
	static fromPrivateKey(options: PrivateKeySignerOptions): PrivateKeySignerImpl {
		const privateKey = typeof options.privateKey === "string"
			? hexToBytes(options.privateKey)
			: options.privateKey;

		return new PrivateKeySignerImpl(privateKey);
	}

	/**
	 * Generate a random private key signer
	 * @returns New private key signer with random key
	 */
	static random(): PrivateKeySignerImpl {
		const privateKey = secp256k1.utils.randomPrivateKey();
		return new PrivateKeySignerImpl(privateKey);
	}

	/**
	 * Get the private key (use with caution!)
	 * @returns Private key as hex string with 0x prefix
	 */
	getPrivateKey(): string {
		return `0x${bytesToHex(this.privateKeyBytes)}`;
	}

	/**
	 * Derive Ethereum address from private key
	 * @returns Ethereum address as checksummed hex string
	 */
	private deriveAddress(): string {
		// Get public key (uncompressed, 65 bytes: 0x04 + x + y)
		const publicKey = secp256k1.getPublicKey(this.privateKeyBytes, false);

		// Remove the 0x04 prefix to get raw 64-byte public key
		const publicKeyRaw = publicKey.slice(1);

		// Hash with Keccak-256
		const hash = keccak_256(publicKeyRaw);

		// Take last 20 bytes
		const addressBytes = hash.slice(-20);

		// Convert to Address for checksumming
		const addr = new Address(addressBytes);
		return addr.toChecksumHex();
	}

	/**
	 * Sign a transaction
	 * @param transaction - Unsigned or partially signed transaction
	 * @returns Fully signed transaction
	 */
	async signTransaction(transaction: Transaction): Promise<Transaction> {
		// Import transaction encoding functions
		const {
			encodeLegacyForSigning,
			encodeEip1559ForSigning,
			encodeEip7702ForSigning,
			fromHex,
		} = await import("../../primitives/transaction.ts");

		// Determine transaction type and encode for signing
		let encoded: string;
		let chainId: bigint;

		if ("gasPrice" in transaction) {
			// Legacy transaction
			chainId = transaction.v > 35n
				? (transaction.v - 35n) / 2n
				: 1n;
			encoded = encodeLegacyForSigning(transaction, chainId);
		} else if ("authorizationList" in transaction) {
			// EIP-7702
			chainId = transaction.chainId;
			encoded = encodeEip7702ForSigning(transaction);
		} else {
			// EIP-1559
			chainId = transaction.chainId;
			encoded = encodeEip1559ForSigning(transaction);
		}

		// Hash the encoded transaction
		const txBytes = fromHex(encoded);
		const messageHash = keccak_256(txBytes);

		// Sign the hash
		const signature = secp256k1.sign(messageHash, this.privateKeyBytes);

		// Extract r, s, and recovery id
		const r = `0x${signature.r.toString(16).padStart(64, "0")}`;
		const s = `0x${signature.s.toString(16).padStart(64, "0")}`;
		const recovery = signature.recovery || 0;

		// Calculate v based on transaction type
		let v: bigint;
		if ("gasPrice" in transaction) {
			// Legacy: v = chainId * 2 + 35 + recovery
			v = chainId * 2n + 35n + BigInt(recovery);
		} else {
			// EIP-1559/EIP-7702: v = recovery (0 or 1)
			v = BigInt(recovery);
		}

		// Return signed transaction
		return {
			...transaction,
			v,
			r,
			s,
		};
	}

	/**
	 * Sign a message using EIP-191 personal message format
	 * @param message - Message to sign
	 * @returns Signature as 65-byte hex string
	 */
	async signMessage(message: Uint8Array | string): Promise<string> {
		// Hash the message using EIP-191 format
		const messageHashHex = hashMessage(message);
		const messageHash = hexToBytes(messageHashHex);

		// Sign the hash
		const signature = secp256k1.sign(messageHash, this.privateKeyBytes);

		// Extract r, s, v
		const r = signature.r.toString(16).padStart(64, "0");
		const s = signature.s.toString(16).padStart(64, "0");
		const v = (signature.recovery || 0) + 27; // EIP-191 uses 27/28

		// Return as compact signature
		return `0x${r}${s}${v.toString(16).padStart(2, "0")}`;
	}

	/**
	 * Sign typed data using EIP-712
	 * @param typedData - Structured data to sign
	 * @returns Signature as 65-byte hex string
	 */
	async signTypedData(typedData: TypedMessage): Promise<string> {
		// Hash the typed data using EIP-712
		const dataHashHex = hashTypedData(typedData.domain, typedData);
		const dataHash = hexToBytes(dataHashHex);

		// Sign the hash
		const signature = secp256k1.sign(dataHash, this.privateKeyBytes);

		// Extract r, s, v
		const r = signature.r.toString(16).padStart(64, "0");
		const s = signature.s.toString(16).padStart(64, "0");
		const v = (signature.recovery || 0) + 27; // EIP-712 uses 27/28

		// Return as compact signature
		return `0x${r}${s}${v.toString(16).padStart(2, "0")}`;
	}
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

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}
