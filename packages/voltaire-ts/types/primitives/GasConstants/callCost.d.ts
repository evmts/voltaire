/**
 * Calculate CALL operation gas cost (convenience form with this:)
 *
 * @this {{ isWarm: boolean; hasValue: boolean; isNewAccount: boolean; availableGas: bigint }}
 * @returns {{ base: bigint; dynamic: bigint; stipend: bigint; forwarded: bigint; total: bigint }}
 */
export function callCost(this: {
    isWarm: boolean;
    hasValue: boolean;
    isNewAccount: boolean;
    availableGas: bigint;
}): {
    base: bigint;
    dynamic: bigint;
    stipend: bigint;
    forwarded: bigint;
    total: bigint;
};
//# sourceMappingURL=callCost.d.ts.map