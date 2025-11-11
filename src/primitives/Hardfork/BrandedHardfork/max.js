import { compare } from "./compare.js";
import { ValidationError } from "../../errors/ValidationError.js";

/**
 * Get maximum hardfork from array
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork[]} forks - Array of hardforks
 * @returns {import('./BrandedHardfork.js').BrandedHardfork} Maximum (newest) hardfork
 * @throws {ValidationError} If array is empty
 *
 * @example
 * ```typescript
 * import { CANCUN, BERLIN, SHANGHAI, max } from './hardfork.js';
 *
 * const newest = max([CANCUN, BERLIN, SHANGHAI]); // CANCUN
 * ```
 */
export function max(forks) {
	if (forks.length === 0) {
		throw new ValidationError("Cannot get max of empty array", {
			value: forks,
			expected: "Non-empty array",
			code: "HARDFORK_EMPTY_ARRAY",
			docsPath: "/primitives/hardfork/max#error-handling",
		});
	}
	return forks.reduce((a, b) => (compare(a, b) > 0 ? a : b));
}
