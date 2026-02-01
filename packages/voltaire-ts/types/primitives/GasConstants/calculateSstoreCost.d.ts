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
export function calculateSstoreCost(isWarm: boolean, currentValue: bigint, newValue: bigint): {
    cost: bigint;
    refund: bigint;
};
//# sourceMappingURL=calculateSstoreCost.d.ts.map