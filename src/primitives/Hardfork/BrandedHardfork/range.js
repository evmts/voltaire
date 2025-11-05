import { HARDFORK_ORDER } from "./constants.js";

/**
 * Get range of hardforks between two versions (inclusive)
 *
 * @param {import('./BrandedHardfork.js').BrandedHardfork} start - Start hardfork
 * @param {import('./BrandedHardfork.js').BrandedHardfork} end - End hardfork
 * @returns {import('./BrandedHardfork.js').BrandedHardfork[]} Array of hardfork IDs in range
 *
 * @example
 * ```typescript
 * import { BERLIN, SHANGHAI, range } from './hardfork.js';
 *
 * const r = range(BERLIN, SHANGHAI);
 * // [BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE, SHANGHAI]
 * ```
 */
export function range(start, end) {
	const startIdx = HARDFORK_ORDER.indexOf(start);
	const endIdx = HARDFORK_ORDER.indexOf(end);

	if (startIdx === -1 || endIdx === -1) {
		throw new Error("Invalid hardfork in range");
	}

	const [minIdx, maxIdx] =
		startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
	const result = HARDFORK_ORDER.slice(minIdx, maxIdx + 1);

	return startIdx <= endIdx ? result : result.reverse();
}
