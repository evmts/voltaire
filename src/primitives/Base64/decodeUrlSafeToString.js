import * as OxBase64 from "ox/Base64";

/**
 * Decode URL-safe base64 to UTF-8 string
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {string} Decoded string
 */
export function decodeUrlSafeToString(encoded) {
	return OxBase64.toString(encoded);
}
