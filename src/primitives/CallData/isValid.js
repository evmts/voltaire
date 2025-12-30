import { MIN_SIZE } from "./constants.js";

/**
 * Check if value can be converted to CallData
 *
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value can be converted to CallData
 *
 * @example
 * ```javascript
 * CallData.isValid("0xa9059cbb"); // true (valid 4-byte selector)
 * CallData.isValid("0x1234"); // false (only 2 bytes)
 * CallData.isValid("0xGGGG"); // false (invalid hex)
 * CallData.isValid(null); // false
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Validation requires checking multiple value types
export function isValid(value) {
	// Handle Uint8Array
	if (value instanceof Uint8Array) {
		return value.length >= MIN_SIZE;
	}

	// Handle string
	if (typeof value === "string") {
		// Normalize to 0x format
		const normalized = value.startsWith("0x") ? value : `0x${value}`;

		// Remove 0x prefix, check length (must be at least 8 hex chars = 4 bytes)
		const hexPart = normalized.slice(2);
		if (hexPart.length < MIN_SIZE * 2) return false;

		// Must be even length (byte-aligned)
		if (hexPart.length % 2 !== 0) return false;

		// Check all characters are valid hex
		for (let i = 0; i < hexPart.length; i++) {
			const c = hexPart.charCodeAt(i);
			const isHex =
				(c >= 48 && c <= 57) || // 0-9
				(c >= 65 && c <= 70) || // A-F
				(c >= 97 && c <= 102); // a-f
			if (!isHex) return false;
		}

		return true;
	}

	return false;
}
