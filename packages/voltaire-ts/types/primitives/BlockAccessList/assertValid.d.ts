/**
 * Assert that a block access list satisfies every EIP-7928 rule that is
 * checkable without the block: field types and ranges, canonical ordering,
 * and uniqueness.
 *
 * It does not check that access indices stay within `len(transactions) + 1`
 * or the `ITEM_COST` size bound; both need the block.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {readonly import('./BlockAccessListType.js').AccountChanges[]} list
 * @returns {asserts list is import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If any rule is violated
 */
export function assertValid(list: readonly import("./BlockAccessListType.js").AccountChanges[]): asserts list is import("./BlockAccessListType.js").BlockAccessListType;
//# sourceMappingURL=assertValid.d.ts.map