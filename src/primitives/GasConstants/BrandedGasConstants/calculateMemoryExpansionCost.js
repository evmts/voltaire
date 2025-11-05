import { Memory, QuadCoeffDiv } from "./constants.js";

/**
 * Calculate memory expansion cost
 *
 * @param {bigint} oldSize - Previous memory size in bytes
 * @param {bigint} newSize - New memory size in bytes
 * @returns {{ oldCost: bigint; newCost: bigint; expansionCost: bigint; words: bigint }} Memory expansion cost
 *
 * @example
 * ```typescript
 * const expansion = calculateMemoryExpansionCost(64n, 128n);
 * // { oldCost, newCost, expansionCost, words }
 * ```
 */
export function calculateMemoryExpansionCost(oldSize, newSize) {
	const oldWords = (oldSize + 31n) / 32n;
	const newWords = (newSize + 31n) / 32n;

	const oldCost = Memory * oldWords + (oldWords * oldWords) / QuadCoeffDiv;
	const newCost = Memory * newWords + (newWords * newWords) / QuadCoeffDiv;
	const expansionCost = newCost > oldCost ? newCost - oldCost : 0n;

	return { oldCost, newCost, expansionCost, words: newWords };
}
