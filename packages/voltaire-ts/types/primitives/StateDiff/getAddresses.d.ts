/**
 * Get all addresses with state changes
 *
 * @param {import('./StateDiffType.js').StateDiffType} diff - State diff
 * @returns {Array<import('../Address/AddressType.js').AddressType>} Array of addresses
 *
 * @example
 * ```typescript
 * const addresses = StateDiff.getAddresses(diff);
 * for (const addr of addresses) {
 *   console.log(`Account ${Address.toHex(addr)} changed`);
 * }
 * ```
 */
export function getAddresses(diff: import("./StateDiffType.js").StateDiffType): Array<import("../Address/AddressType.js").AddressType>;
//# sourceMappingURL=getAddresses.d.ts.map