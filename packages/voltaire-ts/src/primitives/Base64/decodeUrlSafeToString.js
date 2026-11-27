import { decodeUrlSafe } from "./decodeUrlSafe.js";

const textDecoder = new TextDecoder();

/**
 * Decode URL-safe base64 to UTF-8 string
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {string} Decoded string
 */
export function decodeUrlSafeToString(encoded) {
	return textDecoder.decode(decodeUrlSafe(encoded));
}
