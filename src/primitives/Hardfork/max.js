import { ValidationError } from "../errors/index.js";
import { compare } from "./compare.js";

/**
 * Get maximum hardfork from array
 *
 * @param {import('./HardforkType.ts').HardforkType[]} forks - Array of hardforks
 * @returns {import('./HardforkType.ts').HardforkType} Maximum (newest) hardfork
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
