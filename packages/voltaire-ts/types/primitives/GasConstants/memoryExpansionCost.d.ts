/**
 * Calculate memory expansion cost (convenience form with this:)
 *
 * @this {{ oldSize: bigint; newSize: bigint }}
 * @returns {{ oldCost: bigint; newCost: bigint; expansionCost: bigint; words: bigint }}
 */
export function memoryExpansionCost(this: {
    oldSize: bigint;
    newSize: bigint;
}): {
    oldCost: bigint;
    newCost: bigint;
    expansionCost: bigint;
    words: bigint;
};
//# sourceMappingURL=memoryExpansionCost.d.ts.map