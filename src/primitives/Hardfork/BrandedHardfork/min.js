import { ValidationError } from "../../errors/ValidationError.js";
import { compare } from "./compare.js";

/**
 * Get minimum hardfork from array
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork[]} forks - Array of hardforks
 * @returns {import('./BrandedHardfork.js').BrandedHardfork} Minimum (oldest) hardfork
 * @throws {ValidationError} If array is empty
 *
 * @example
 * ```typescript
 * import { CANCUN, BERLIN, SHANGHAI, min } from './hardfork.js';
 *
 * const oldest = min([CANCUN, BERLIN, SHANGHAI]); // BERLIN
 * ```
 */
export function min(forks) {
	if (forks.length === 0) {
		throw new ValidationError("Cannot get min of empty array", {
			value: forks,
			expected: "Non-empty array",
			code: "HARDFORK_EMPTY_ARRAY",
			docsPath: "/primitives/hardfork/min#error-handling",
		});
	}
	return forks.reduce((a, b) => (compare(a, b) < 0 ? a : b));
}
