/**
 * Check if string is valid address format (standard form)
 *
 * @param {string} str - String to validate
 * @returns {boolean} True if valid hex format (with or without 0x)
 *
 * @example
 * ```typescript
 * if (Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * }
 * ```
 */
export function isValid(str) {
	// Normalize to 0x format
	const normalized = str.startsWith("0x") ? str : `0x${str}`;

	// Must be 0x + 40 hex chars = 42 chars total
	if (normalized.length !== 42) return false;

	// Check all characters are valid hex
	for (let i = 2; i < normalized.length; i++) {
		const c = normalized.charCodeAt(i);
		const isHex =
			(c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
		if (!isHex) return false;
	}

	return true;
}
