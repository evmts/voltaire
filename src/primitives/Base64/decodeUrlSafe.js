import { decode } from "./decode.js";

/**
 * Decode URL-safe base64 string to bytes
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If input is invalid
 */
export function decodeUrlSafe(encoded) {
	let standard = encoded.replace(/-/g, "+").replace(/_/g, "/");

	const pad = encoded.length % 4;
	if (pad === 2) standard += "==";
	else if (pad === 3) standard += "=";

	return decode(standard);
}
