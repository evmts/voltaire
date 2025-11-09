import * as OxAddress from "ox/Address";

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
	// Normalize to 0x format for ox validation
	const normalized = str.startsWith("0x") ? str : `0x${str}`;
	return OxAddress.validate(normalized, { strict: false });
}
