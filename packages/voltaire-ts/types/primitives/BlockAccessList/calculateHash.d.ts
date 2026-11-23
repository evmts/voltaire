/**
 * Compute the EIP-7928 header commitment `keccak256(rlp.encode(block_access_list))`.
 *
 * The result is the `blockAccessListHash` field of an Amsterdam block header.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {import('./BlockAccessListType.js').BlockAccessListType} list - Canonical list from `from` or `fromRlp`
 * @returns {import('../Hash/HashType.js').HashType} 32-byte hash
 * @example
 * ```javascript
 * import { BlockAccessList, Hash } from "@tevm/voltaire";
 *
 * Hash.toHex(BlockAccessList.calculateHash(BlockAccessList.from([])));
 * // 0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347
 * ```
 */
export function calculateHash(list: import("./BlockAccessListType.js").BlockAccessListType): import("../Hash/HashType.js").HashType;
//# sourceMappingURL=calculateHash.d.ts.map