/**
 * Generate a cryptographically secure random nonce for SIWE messages
 *
 * @param {number} [length=11] - Length of nonce (minimum 8)
 * @returns {string} Random alphanumeric nonce string
 *
 * @example
 * ```typescript
 * const nonce = generateNonce();
 * // Returns something like "a7b9c2d4e6f"
 *
 * const longNonce = generateNonce(16);
 * // Returns something like "a7b9c2d4e6f8g0h1"
 * ```
 */
export function generateNonce(length = 11) {
	if (length < 8) {
		throw new Error("Nonce length must be at least 8 characters");
	}

	// Use base62 alphanumeric characters (0-9, a-z, A-Z)
	const chars =
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const randomBytes = new Uint8Array(length);

	// Use crypto.getRandomValues for secure randomness
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		crypto.getRandomValues(randomBytes);
	} else {
		// Fallback for Node.js environment
		const nodeCrypto = require("crypto");
		nodeCrypto.randomFillSync(randomBytes);
	}

	let nonce = "";
	for (let i = 0; i < length; i++) {
		const byte = randomBytes[i];
		if (byte !== undefined) {
			nonce += chars[byte % chars.length];
		}
	}

	return nonce;
}
