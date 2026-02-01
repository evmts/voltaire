/**
 * Calculate CALL operation gas cost
 *
 * @param {boolean} isWarm - Whether target account is warm
 * @param {boolean} hasValue - Whether call transfers value
 * @param {boolean} isNewAccount - Whether target account doesn't exist
 * @param {bigint} availableGas - Gas available for the call
 * @returns {{ base: bigint; dynamic: bigint; stipend: bigint; forwarded: bigint; total: bigint }} Gas cost breakdown
 *
 * @example
 * ```typescript
 * const result = calculateCallCost(true, true, false, 100000n);
 * // { base, dynamic, stipend, forwarded, total }
 * ```
 */
export function calculateCallCost(isWarm: boolean, hasValue: boolean, isNewAccount: boolean, availableGas: bigint): {
    base: bigint;
    dynamic: bigint;
    stipend: bigint;
    forwarded: bigint;
    total: bigint;
};
//# sourceMappingURL=calculateCallCost.d.ts.map