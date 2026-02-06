/**
 * Calculate SSTORE gas cost (convenience form with this:)
 *
 * @this {{ isWarm: boolean; currentValue: bigint; newValue: bigint }}
 * @returns {{ cost: bigint; refund: bigint }}
 */
export function sstoreCost(this: {
    isWarm: boolean;
    currentValue: bigint;
    newValue: bigint;
}): {
    cost: bigint;
    refund: bigint;
};
//# sourceMappingURL=sstoreCost.d.ts.map