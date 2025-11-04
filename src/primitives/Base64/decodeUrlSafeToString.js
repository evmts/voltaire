import { decodeUrlSafe } from "./decodeUrlSafe.js";

/**
 * Decode URL-safe base64 to UTF-8 string
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {string} Decoded string
 */
export function decodeUrlSafeToString(encoded) {
	const decoder = new TextDecoder();
	return decoder.decode(decodeUrlSafe(encoded));
}
