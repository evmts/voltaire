/**
 * Create a canonical EIP-7928 block access list.
 *
 * Normalizes addresses, quantities, and bytecode, then sorts accounts by
 * address, slots by key, and every change list by block access index.
 * Duplicates are an error; `from` never merges or drops entries.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {import('./BlockAccessListType.js').BlockAccessListLike} accounts
 * @returns {import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If a value is out of range or duplicated
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * const bal = BlockAccessList.from([
 *   {
 *     address: "0x00000000000000000000000000000000000000aa",
 *     storageChanges: [{ slot: 1n, changes: [{ blockAccessIndex: 1, newValue: 42n }] }],
 *     storageReads: [2n],
 *     balanceChanges: [{ blockAccessIndex: 1, postBalance: 10n ** 18n }],
 *     nonceChanges: [{ blockAccessIndex: 1, newNonce: 1n }],
 *   },
 * ]);
 * ```
 */
export function from(accounts: import("./BlockAccessListType.js").BlockAccessListLike): import("./BlockAccessListType.js").BlockAccessListType;
//# sourceMappingURL=from.d.ts.map