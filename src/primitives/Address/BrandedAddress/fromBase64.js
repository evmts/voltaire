import { fromBytes } from "./fromBytes.js";

/**
 * Create Address from base64 string
 *
 * @param {string} b64 - Base64 encoded string
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address
 * @throws {import('./errors.js').InvalidAddressLengthError} If decoded length is not 20 bytes
 *
 * @example
 * ```typescript
 * const addr = Address.fromBase64("dC01zGY0wFMpJaO4RLyedZXyUeM=");
 * ```
 */
export function fromBase64(b64) {
	// Validate base64 string format
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
		throw new Error("Invalid base64 string");
	}

	let decoded;

	try {
		if (typeof Buffer !== "undefined") {
			decoded = Buffer.from(b64, "base64");
		} else {
			// Browser fallback
			const binary = atob(b64);
			decoded = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				decoded[i] = binary.charCodeAt(i);
			}
		}
	} catch (e) {
		throw new Error("Invalid base64 string");
	}

	// Validate via fromBytes (ensures 20-byte length)
	return fromBytes(decoded);
}
