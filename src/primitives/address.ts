/**
 * Ethereum address utilities
 *
 * Provides address creation, validation, checksumming (EIP-55), and
 * contract address calculation (CREATE and CREATE2).
 */

import { hexToBytes, bytesToHex } from "./hex.ts";
import { keccak256 } from "./keccak.ts";

/**
 * Ethereum address (20 bytes)
 */
export class Address {
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== 20) {
			throw new Error("Address must be exactly 20 bytes");
		}
		this.bytes = bytes;
	}

	/**
	 * Create address from hex string (with or without 0x prefix)
	 * @param hex - Hex string (42 characters with 0x prefix)
	 * @returns Address instance
	 * @throws Error if invalid format
	 */
	static fromHex(hex: string): Address {
		const bytes = hexToBytes(hex);
		return new Address(bytes);
	}

	/**
	 * Convert address to hex string (lowercase, with 0x prefix)
	 * @returns Hex string representation
	 */
	toHex(): string {
		return bytesToHex(this.bytes);
	}

	/**
	 * Convert address to EIP-55 checksummed hex
	 * @returns Checksummed hex string
	 */
	toChecksumHex(): string {
		const hex = this.toHex().slice(2); // Remove 0x
		const hash = keccak256(new TextEncoder().encode(hex));

		let result = "0x";
		for (let i = 0; i < hex.length; i++) {
			const char = hex[i]!;
			const hashByte = hash[Math.floor(i / 2)]!;
			const nibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;

			if (char >= "a" && char <= "f" && nibble >= 8) {
				result += char.toUpperCase();
			} else {
				result += char;
			}
		}

		return result;
	}

	/**
	 * Check if this is the zero address
	 * @returns true if zero address
	 */
	isZero(): boolean {
		return this.bytes.every((byte) => byte === 0);
	}

	/**
	 * Check equality with another address
	 * @param other - Address to compare
	 * @returns true if equal
	 */
	equals(other: Address): boolean {
		if (this.bytes.length !== other.bytes.length) return false;
		for (let i = 0; i < this.bytes.length; i++) {
			if (this.bytes[i] !== other.bytes[i]) return false;
		}
		return true;
	}

	/**
	 * Derive address from public key (uncompressed, 64 bytes)
	 * @param publicKeyX - X coordinate (32 bytes)
	 * @param publicKeyY - Y coordinate (32 bytes)
	 * @returns Address derived from public key
	 */
	static fromPublicKey(publicKeyX: bigint, publicKeyY: bigint): Address {
		// Concatenate x and y coordinates (64 bytes total)
		const pubKeyBytes = new Uint8Array(64);

		// Write x coordinate (big-endian)
		for (let i = 0; i < 32; i++) {
			pubKeyBytes[31 - i] = Number((publicKeyX >> BigInt(i * 8)) & 0xffn);
		}

		// Write y coordinate (big-endian)
		for (let i = 0; i < 32; i++) {
			pubKeyBytes[63 - i] = Number((publicKeyY >> BigInt(i * 8)) & 0xffn);
		}

		// Hash and take last 20 bytes
		const hash = keccak256(pubKeyBytes);
		return new Address(hash.slice(12));
	}

	/**
	 * Convert address to u256
	 * @returns bigint representation
	 */
	toU256(): bigint {
		let result = 0n;
		for (const byte of this.bytes) {
			result = (result << 8n) | BigInt(byte);
		}
		return result;
	}

	/**
	 * Create address from u256
	 * @param value - bigint value (uses last 20 bytes)
	 * @returns Address instance
	 */
	static fromU256(value: bigint): Address {
		const bytes = new Uint8Array(20);
		let v = value;
		for (let i = 19; i >= 0; i--) {
			bytes[i] = Number(v & 0xffn);
			v >>= 8n;
		}
		return new Address(bytes);
	}
}

/**
 * Validate EIP-55 checksum
 * @param hex - Hex string with checksum
 * @returns true if valid checksum
 */
export function validateChecksum(hex: string): boolean {
	try {
		const addr = Address.fromHex(hex);
		return addr.toChecksumHex() === hex;
	} catch {
		return false;
	}
}

/**
 * Calculate CREATE contract address
 * @param sender - Sender address
 * @param nonce - Transaction nonce
 * @returns Contract address
 */
export function calculateCreateAddress(
	sender: Address,
	nonce: bigint,
): Address {
	// RLP encode [sender_address, nonce]
	const rlpEncoded = encodeRlpList(sender.bytes, nonce);

	// Hash and take last 20 bytes
	const hash = keccak256(rlpEncoded);
	return new Address(hash.slice(12));
}

/**
 * Calculate CREATE2 contract address
 * @param deployer - Deployer address
 * @param salt - Salt value (32 bytes)
 * @param initCodeHash - Keccak256 hash of init code (32 bytes)
 * @returns Contract address
 */
export function calculateCreate2Address(
	deployer: Address,
	salt: Uint8Array,
	initCodeHash: Uint8Array,
): Address {
	if (salt.length !== 32) throw new Error("Salt must be 32 bytes");
	if (initCodeHash.length !== 32)
		throw new Error("Init code hash must be 32 bytes");

	// Concatenate: 0xff ++ deployer ++ salt ++ initCodeHash
	const data = new Uint8Array(1 + 20 + 32 + 32);
	data[0] = 0xff;
	data.set(deployer.bytes, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);

	// Hash and take last 20 bytes
	const hash = keccak256(data);
	return new Address(hash.slice(12));
}

/**
 * Zero address constant
 */
export const ZERO_ADDRESS = new Address(new Uint8Array(20));

// Helper: Simple RLP encoding for [address, nonce]
function encodeRlpList(address: Uint8Array, nonce: bigint): Uint8Array {
	// Encode nonce as minimal big-endian bytes (strip leading zeros)
	let nonceBytes: Uint8Array;
	if (nonce === 0n) {
		// For nonce 0, use empty bytes
		nonceBytes = new Uint8Array([]);
	} else {
		const hex = nonce.toString(16);
		const padded = hex.length % 2 === 0 ? hex : "0" + hex;
		nonceBytes = new Uint8Array(
			padded.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
		);
	}

	// RLP encode both items
	const addressRlp = new Uint8Array([0x80 + 20, ...address]); // Address is always 20 bytes
	const nonceRlp = encodeRlpItem(nonceBytes);

	const listLength = addressRlp.length + nonceRlp.length;
	const prefix = new Uint8Array([0xc0 + listLength]);

	return new Uint8Array([...prefix, ...addressRlp, ...nonceRlp]);
}

function encodeRlpItem(bytes: Uint8Array): Uint8Array {
	// Empty bytes
	if (bytes.length === 0) {
		return new Uint8Array([0x80]);
	}

	// Single byte < 0x80
	if (bytes.length === 1 && bytes[0]! < 0x80) {
		return bytes;
	}

	// Short string (< 56 bytes)
	if (bytes.length < 56) {
		return new Uint8Array([0x80 + bytes.length, ...bytes]);
	}

	// Long string (>= 56 bytes)
	const lengthBytes = toBigEndian(bytes.length);
	return new Uint8Array([0xb7 + lengthBytes.length, ...lengthBytes, ...bytes]);
}

function toBigEndian(value: number): Uint8Array {
	const hex = value.toString(16);
	const padded = hex.length % 2 === 0 ? hex : "0" + hex;
	return new Uint8Array(
		padded.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
	);
}
