import { encodeHexDigits } from "../primitives/Hex/encodeHexDigits.js";

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
	return `0x${encodeHexDigits(bytes)}`;
}
