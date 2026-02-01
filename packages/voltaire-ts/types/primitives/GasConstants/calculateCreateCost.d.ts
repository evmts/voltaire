/**
 * Calculate contract creation gas cost
 *
 * @param {bigint} initcodeSize - Size of initcode in bytes
 * @param {bigint} deployedSize - Size of deployed bytecode in bytes
 * @returns {{ base: bigint; dynamic: bigint; total: bigint }} Gas cost breakdown
 * @throws {InvalidRangeError} If initcode size exceeds maximum
 *
 * @example
 * ```typescript
 * const result = calculateCreateCost(1000n, 500n);
 * // { base: 32000n, initcode: ..., deployed: ..., total: ... }
 * ```
 */
export function calculateCreateCost(initcodeSize: bigint, deployedSize: bigint): {
    base: bigint;
    dynamic: bigint;
    total: bigint;
};
//# sourceMappingURL=calculateCreateCost.d.ts.map