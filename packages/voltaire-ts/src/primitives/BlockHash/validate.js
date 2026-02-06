import { SIZE } from "./BlockHashType.js";

/**
 * Validate if value is a valid BlockHash
 *
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if valid BlockHash (32-byte Uint8Array)
 *
 * @example
 * ```typescript
 * const valid = BlockHash.validate(value);
 * ```
 */
export function validate(value) {
	if (!(value instanceof Uint8Array)) {
		return false;
	}
	return value.length === SIZE;
}
