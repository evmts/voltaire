import * as OxSiwe from "ox/Siwe";

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

	// Generate ox nonce (96 chars) and truncate to desired length
	const oxNonce = OxSiwe.generateNonce();
	return oxNonce.slice(0, length);
}
