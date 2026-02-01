/**
 * Create StateDiff from account changes
 *
 * @param {Map<import('../Address/AddressType.js').AddressType, import('./StateDiffType.js').AccountDiff> | Array<[import('../Address/AddressType.js').AddressType, import('./StateDiffType.js').AccountDiff]> | { accounts: Map<import('../Address/AddressType.js').AddressType, import('./StateDiffType.js').AccountDiff> }} value - Account changes map, array, or object
 * @returns {import('./StateDiffType.js').StateDiffType} StateDiff
 *
 * @example
 * ```typescript
 * const diff = StateDiff.from(new Map([[address, { balance: { from: 0n, to: 100n } }]]));
 * const diff2 = StateDiff.from([[address, { nonce: { from: 0n, to: 1n } }]]);
 * const diff3 = StateDiff.from({ accounts: accountsMap });
 * ```
 */
export function from(value) {
    // If already StateDiff object with accounts
    if (value && typeof value === "object" && "accounts" in value) {
        return {
            accounts: value.accounts instanceof Map
                ? value.accounts
                : new Map(value.accounts || []),
        };
    }
    // If Map or array
    if (value instanceof Map || Array.isArray(value)) {
        return {
            accounts: value instanceof Map ? value : new Map(value),
        };
    }
    throw new Error("Invalid StateDiff input");
}
