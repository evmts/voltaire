/**
 * WASM Signature operations wrapper for src/wasm/index.ts
 * Re-exports secp256k1 signature functions from secp256k1.wasm.ts
 */

import * as loader from "../wasm-loader/loader.js";
import { Secp256k1Wasm } from "./secp256k1.wasm.js";

/**
 * ParsedSignature type
 * @typedef {Object} ParsedSignature
 * @property {Uint8Array} r - R component (32 bytes)
 * @property {Uint8Array} s - S component (32 bytes)
 * @property {number} v - Recovery ID (0, 1, 27, or 28)
 */

// Export ParsedSignature as a value for ES module compatibility
export const ParsedSignature = undefined;

/**
 * Recover public key from signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {Uint8Array} Recovered public key (64 bytes)
 */
export function secp256k1RecoverPubkey(messageHash, signature) {
	const parsed = signatureParse(signature);
	return Secp256k1Wasm.recoverPublicKey(parsed, messageHash);
}

/**
 * Recover Ethereum address from signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {Uint8Array} Recovered address (20 bytes)
 */
export function secp256k1RecoverAddress(messageHash, signature) {
	const pubkey = secp256k1RecoverPubkey(messageHash, signature);
	const hash = loader.keccak256(pubkey);
	return hash.slice(-20);
}

/**
 * Derive public key from private key
 * @param {Uint8Array} privateKey - Private key (32 bytes)
 * @returns {Uint8Array} Public key (64 bytes)
 */
export function secp256k1PubkeyFromPrivate(privateKey) {
	return Secp256k1Wasm.derivePublicKey(privateKey);
}

/**
 * Validate signature against public key
 * @param {Uint8Array} signature - 65-byte signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} publicKey - Public key (64 bytes)
 * @returns {boolean} True if signature is valid
 */
export function secp256k1ValidateSignature(signature, messageHash, publicKey) {
	const parsed = signatureParse(signature);
	return Secp256k1Wasm.verify(parsed, messageHash, publicKey);
}

/**
 * Normalize signature to low-s form
 * @param {Uint8Array} signature - 65-byte signature
 * @returns {Uint8Array} Normalized signature
 */
export function signatureNormalize(signature) {
	const parsed = signatureParse(signature);

	// Check if s > n/2, if so normalize it
	const s = bytes32ToBigInt(parsed.s);
	const halfN = Secp256k1Wasm.CURVE_ORDER / 2n;

	if (s > halfN) {
		const normalizedS = Secp256k1Wasm.CURVE_ORDER - s;
		const sBytes = bigIntToBytes32(normalizedS);
		return signatureSerialize({ r: parsed.r, s: sBytes, v: parsed.v });
	}

	return signature;
}

/**
 * Check if signature is in canonical form
 * @param {Uint8Array} signature - 65-byte signature
 * @returns {boolean} True if signature is canonical
 */
export function signatureIsCanonical(signature) {
	const parsed = signatureParse(signature);
	return Secp256k1Wasm.isValidSignature(parsed);
}

/**
 * Parse signature from bytes
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {ParsedSignature} Parsed signature object
 */
export function signatureParse(signature) {
	return Secp256k1Wasm.Signature.fromBytes(signature);
}

/**
 * Serialize signature to bytes
 * @param {ParsedSignature} signature - Parsed signature object
 * @returns {Uint8Array} 65-byte signature (r+s+v)
 */
export function signatureSerialize(signature) {
	return Secp256k1Wasm.Signature.toBytes(signature);
}

// Helper functions
function bytes32ToBigInt(bytes) {
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

function bigIntToBytes32(value) {
	const bytes = new Uint8Array(32);
	let v = value;
	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}
