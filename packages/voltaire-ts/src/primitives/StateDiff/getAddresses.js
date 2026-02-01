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
export function getAddresses(diff) {
	return Array.from(diff.accounts.keys());
}
