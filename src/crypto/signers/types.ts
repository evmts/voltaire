/**
 * Signer Interface Types
 *
 * Provides comprehensive signer interfaces for Ethereum transaction signing,
 * message signing (EIP-191), and typed data signing (EIP-712).
 */

import type { Transaction } from "../../primitives/transaction.ts";
import type { TypedMessage } from "../eip712.ts";

/**
 * Signer type discriminator
 */
export type SignerType = "privateKey" | "hdWallet" | "hardware" | "custom";

/**
 * Base signer interface
 * All signers must implement these core methods
 */
export interface Signer {
	/** Type of signer */
	readonly type: SignerType;

	/** Ethereum address for this signer */
	readonly address: string;

	/**
	 * Sign a transaction
	 * @param transaction - Unsigned or partially signed transaction
	 * @returns Fully signed transaction with v, r, s values
	 */
	signTransaction(transaction: Transaction): Promise<Transaction>;

	/**
	 * Sign a message using EIP-191 personal message format
	 * @param message - Message to sign (string or bytes)
	 * @returns Signature as 65-byte hex string (r + s + v)
	 */
	signMessage(message: Uint8Array | string): Promise<string>;

	/**
	 * Sign typed data using EIP-712
	 * @param typedData - Structured data to sign
	 * @returns Signature as 65-byte hex string (r + s + v)
	 */
	signTypedData(typedData: TypedMessage): Promise<string>;
}

/**
 * Private key signer
 * Signs using a raw private key (32 bytes)
 */
export interface PrivateKeySigner extends Signer {
	readonly type: "privateKey";

	/**
	 * Get the private key (use with caution!)
	 * @returns Private key as 32-byte hex string
	 */
	getPrivateKey(): string;
}

/**
 * HD wallet signer
 * Signs using a key derived from a mnemonic phrase
 */
export interface HDWalletSigner extends Signer {
	readonly type: "hdWallet";

	/** BIP-44 derivation path (e.g., "m/44'/60'/0'/0/0") */
	readonly path: string;

	/** Account index in the derivation path */
	readonly index: number;

	/**
	 * Get the mnemonic phrase (use with caution!)
	 * @returns Mnemonic phrase as string
	 */
	getMnemonic(): string;

	/**
	 * Derive a new signer at a different index
	 * @param index - Account index
	 * @returns New signer at the specified index
	 */
	deriveIndex(index: number): Promise<HDWalletSigner>;

	/**
	 * Derive a new signer at a custom path
	 * @param path - Custom BIP-44 path
	 * @returns New signer at the specified path
	 */
	derivePath(path: string): Promise<HDWalletSigner>;
}

/**
 * Hardware wallet signer
 * Signs using a hardware wallet device (Ledger, Trezor, etc.)
 */
export interface HardwareWalletSigner extends Signer {
	readonly type: "hardware";

	/** Hardware device type */
	readonly deviceType: "ledger" | "trezor";

	/** BIP-44 derivation path used by the hardware device */
	readonly path: string;

	/**
	 * Connect to the hardware device
	 * Must be called before signing operations
	 */
	connect(): Promise<void>;

	/**
	 * Disconnect from the hardware device
	 */
	disconnect(): Promise<void>;

	/**
	 * Check if device is connected
	 */
	isConnected(): boolean;
}

/**
 * Options for creating a private key signer
 */
export interface PrivateKeySignerOptions {
	/** Private key as hex string (with or without 0x prefix) */
	privateKey: string | Uint8Array;
}

/**
 * Options for creating an HD wallet signer
 */
export interface HDWalletSignerOptions {
	/** Mnemonic phrase (12, 15, 18, 21, or 24 words) */
	mnemonic: string;

	/** Base derivation path (default: "m/44'/60'/0'/0") */
	path?: string;

	/** Account index (default: 0) */
	index?: number;

	/** Optional passphrase for mnemonic */
	passphrase?: string;
}

/**
 * Options for creating a hardware wallet signer
 */
export interface HardwareWalletSignerOptions {
	/** Device type */
	deviceType: "ledger" | "trezor";

	/** Derivation path (default: "m/44'/60'/0'/0/0") */
	path?: string;

	/** Device-specific options */
	deviceOptions?: Record<string, unknown>;
}

/**
 * Signature format (65 bytes: r + s + v)
 */
export interface Signature {
	/** r value (32 bytes) */
	r: string;

	/** s value (32 bytes) */
	s: string;

	/** Recovery id (0, 1, 27, or 28) */
	v: number;

	/** Compact representation (65 bytes as hex) */
	compact: string;
}

/**
 * Parse a compact signature into components
 * @param signature - 65-byte signature (r + s + v)
 * @returns Parsed signature components
 */
export function parseSignature(signature: string | Uint8Array): Signature {
	const bytes = typeof signature === "string"
		? hexToBytes(signature)
		: signature;

	if (bytes.length !== 65) {
		throw new Error("Invalid signature length: expected 65 bytes");
	}

	const r = `0x${bytesToHex(bytes.slice(0, 32))}`;
	const s = `0x${bytesToHex(bytes.slice(32, 64))}`;
	const v = bytes[64]!;

	return {
		r,
		s,
		v,
		compact: `0x${bytesToHex(bytes)}`,
	};
}

/**
 * Serialize signature components into compact format
 * @param r - r value (32 bytes)
 * @param s - s value (32 bytes)
 * @param v - Recovery id
 * @returns 65-byte signature as hex string
 */
export function serializeSignature(r: string | Uint8Array, s: string | Uint8Array, v: number): string {
	const rBytes = typeof r === "string" ? hexToBytes(r) : r;
	const sBytes = typeof s === "string" ? hexToBytes(s) : s;

	if (rBytes.length !== 32 || sBytes.length !== 32) {
		throw new Error("Invalid signature component length: r and s must be 32 bytes");
	}

	const signature = new Uint8Array(65);
	signature.set(rBytes, 0);
	signature.set(sBytes, 32);
	signature[64] = v;

	return `0x${bytesToHex(signature)}`;
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
