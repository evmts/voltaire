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
export function calculateMemoryExpansionCost(oldSize: bigint, newSize: bigint): {
    oldCost: bigint;
    newCost: bigint;
    expansionCost: bigint;
    words: bigint;
};
//# sourceMappingURL=calculateMemoryExpansionCost.d.ts.map