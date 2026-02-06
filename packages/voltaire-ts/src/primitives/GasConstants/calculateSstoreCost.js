import {
	ColdSload,
	Sload,
	SstoreClear,
	SstoreRefund,
	SstoreReset,
	SstoreSet,
} from "./constants.js";

/**
 * Calculate SSTORE gas cost
 *
 * @param {boolean} isWarm - Whether slot is warm (previously accessed)
 * @param {bigint} currentValue - Current storage value (0n if empty)
 * @param {bigint} newValue - New storage value
 * @returns {{ cost: bigint; refund: bigint }} Gas cost and potential refund
 *
 * @example
 * ```typescript
 * const result = calculateSstoreCost(false, 0n, 100n);
 * // { cost: 22100n, refund: 0n } - cold + set
 * ```
 */
export function calculateSstoreCost(isWarm, currentValue, newValue) {
	let cost = isWarm ? 0n : ColdSload;
	let refund = 0n;

	if (currentValue === newValue) {
		cost += Sload;
	} else if (currentValue === 0n && newValue !== 0n) {
		cost += SstoreSet;
	} else if (currentValue !== 0n && newValue === 0n) {
		cost += SstoreClear;
		refund = SstoreRefund;
	} else {
		cost += SstoreReset;
	}

	return { cost, refund };
}
