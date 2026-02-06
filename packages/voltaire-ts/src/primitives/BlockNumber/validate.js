import { MAX, MIN } from "./constants.js";

/**
 * Validate if value is a valid BlockNumber
 *
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if valid BlockNumber
 *
 * @example
 * ```typescript
 * const valid = BlockNumber.validate(value);
 * ```
 */
export function validate(value) {
	if (typeof value !== "bigint") {
		return false;
	}
	return value >= MIN && value <= MAX;
}
