/**
 * Calculate contract creation gas cost (convenience form with this:)
 *
 * @this {{ initcodeSize: bigint; deployedSize: bigint }}
 * @returns {{ base: bigint; dynamic: bigint; total: bigint }}
 */
export function createCost(this: {
    initcodeSize: bigint;
    deployedSize: bigint;
}): {
    base: bigint;
    dynamic: bigint;
    total: bigint;
};
//# sourceMappingURL=createCost.d.ts.map