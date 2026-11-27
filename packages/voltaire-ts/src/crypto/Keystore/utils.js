import { encodeHexDigits } from "../../primitives/Hex/encodeHexDigits.js";
import { parseHexByte } from "../../primitives/Hex/parseHexByte.js";
import { KeystoreError } from "./errors.js";

/**
 * Convert Uint8Array to hex string (without 0x prefix)
 *
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {string} Hex string without 0x prefix
 */
export function bytesToHex(bytes) {
	return encodeHexDigits(bytes);
}

/**
 * Convert hex string to Uint8Array (with or without 0x prefix)
 *
 * @param {string} hex - Hex string
 * @returns {Uint8Array} Bytes
 * @throws {KeystoreError} If the hex digits are malformed
 */
export function hexToBytes(hex) {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) {
		throw new KeystoreError("Expected an even number of hexadecimal digits");
	}
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(clean, i * 2);
	}
	return bytes;
}

/**
 * Generate a UUID v4
 *
 * @returns {string} UUID
 */
export function generateUuid() {
	return crypto.randomUUID();
}

/**
 * Concatenate multiple Uint8Arrays
 *
 * @param {...Uint8Array} arrays - Arrays to concatenate
 * @returns {Uint8Array} Concatenated array
 */
export function concat(...arrays) {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
