/**
 * Get account diff for a specific address
 *
 * @param {import('./StateDiffType.js').StateDiffType} diff - State diff
 * @param {import('../Address/AddressType.js').AddressType} address - Address to look up
 * @returns {import('./StateDiffType.js').AccountDiff | undefined} Account diff or undefined
 *
 * @example
 * ```typescript
 * const accountDiff = StateDiff.getAccount(diff, address);
 * if (accountDiff?.balance) {
 *   console.log(`Balance: ${accountDiff.balance.from} -> ${accountDiff.balance.to}`);
 * }
 * ```
 */
export function getAccount(diff: import("./StateDiffType.js").StateDiffType, address: import("../Address/AddressType.js").AddressType): import("./StateDiffType.js").AccountDiff | undefined;
//# sourceMappingURL=getAccount.d.ts.map