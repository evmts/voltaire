import { compare } from "./compare.js";

/**
 * Get minimum hardfork from array
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork[]} forks - Array of hardforks
 * @returns {import('./BrandedHardfork.js').BrandedHardfork} Minimum (oldest) hardfork
 * @throws {Error} If array is empty
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
		throw new Error("Cannot get min of empty array");
	}
	return forks.reduce((a, b) => (compare(a, b) < 0 ? a : b));
}
