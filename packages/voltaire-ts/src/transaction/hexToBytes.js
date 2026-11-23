import { parseHexByte } from "../primitives/Hex/parseHexByte.js";

/**
 * Convert hex string to Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(cleanHex, i * 2);
	}
	return bytes;
}
