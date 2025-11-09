import * as OxBase64 from "ox/Base64";

/**
 * Decode URL-safe base64 string to bytes
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If input is invalid
 */
export function decodeUrlSafe(encoded) {
	return OxBase64.toBytes(encoded);
}
