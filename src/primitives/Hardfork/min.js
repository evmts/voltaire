import { ValidationError } from "../errors/index.js";
import { compare } from "./compare.js";

/**
 * Get minimum hardfork from array
 *
 * @param {import('./HardforkType.ts').HardforkType[]} forks - Array of hardforks
 * @returns {import('./HardforkType.ts').HardforkType} Minimum (oldest) hardfork
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
