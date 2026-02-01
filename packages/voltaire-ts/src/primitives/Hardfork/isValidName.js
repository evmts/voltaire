import { fromString } from "./fromString.js";

/**
 * Check if string is a valid hardfork name
 *
 * @param {string} name - String to validate
 * @returns {boolean} true if valid hardfork name
 *
 * @example
 * ```typescript
 * import { isValidName } from './hardfork.js';
 *
 * isValidName("cancun"); // true
 * isValidName("paris"); // true (alias for merge)
 * isValidName("invalid"); // false
 * ```
 */
export function isValidName(name) {
	return fromString(name) !== undefined;
}
