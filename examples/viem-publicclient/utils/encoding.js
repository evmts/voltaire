/**
 * Encoding Utilities
 *
 * Hex encoding/decoding for RPC communication.
 *
 * @module examples/viem-publicclient/utils/encoding
 */

/**
 * Convert bigint to hex string
 *
 * @param {bigint} value - Value to convert
 * @returns {string} Hex string with 0x prefix
 */
export function numberToHex(value) {
	return `0x${value.toString(16)}`;
}

/**
 * Convert hex string or Uint8Array to hex string
 *
 * @param {string | Uint8Array} value - Value to convert
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(value) {
	if (typeof value === "string") {
		return value;
	}
	return `0x${Array.from(value)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Convert hex string to bigint
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {bigint} Converted value
 */
export function hexToBigInt(hex) {
	return BigInt(hex);
}

/**
 * Convert hex string to number
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {number} Converted value
 */
export function hexToNumber(hex) {
	return Number(BigInt(hex));
}

/**
 * Normalize address to lowercase with 0x prefix
 *
 * @param {string | Uint8Array} address - Address to normalize
 * @returns {string} Normalized address
 */
export function normalizeAddress(address) {
	if (typeof address === "string") {
		return address.toLowerCase();
	}
	// Convert Uint8Array to hex
	const hex = Array.from(address)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `0x${hex}`;
}
