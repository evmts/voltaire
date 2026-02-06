import { InvalidFilterIdError } from "./errors.js";

/**
 * Create FilterId from string
 *
 * @param {string} value - Filter ID string
 * @returns {import('./FilterIdType.js').FilterIdType}
 * @throws {InvalidFilterIdError}
 * @example
 * ```javascript
 * import * as FilterId from './primitives/FilterId/index.js';
 * const id = FilterId.from("0x1");
 * ```
 */
export function from(value) {
	if (typeof value !== "string") {
		throw new InvalidFilterIdError("FilterId must be a string", {
			value,
			expected: "string",
		});
	}

	if (value.length === 0) {
		throw new InvalidFilterIdError("FilterId cannot be empty", {
			value,
			expected: "non-empty string",
		});
	}

	return /** @type {import('./FilterIdType.js').FilterIdType} */ (value);
}
