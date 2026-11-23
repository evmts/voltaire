/**
 * RLP-encode a block access list per EIP-7928.
 *
 * This is the `blockAccessList` payload field of `ExecutionPayloadV4` and the
 * preimage of the header `blockAccessListHash`. Storage keys, values,
 * balances, nonces, and access indices are RLP integers, never 32-byte padded.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {import('./BlockAccessListType.js').BlockAccessListType} list - Canonical list from `from` or `fromRlp`
 * @returns {Uint8Array} RLP bytes
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * BlockAccessList.toRlp(BlockAccessList.from([])); // Uint8Array [0xc0]
 * ```
 */
export function toRlp(list: import("./BlockAccessListType.js").BlockAccessListType): Uint8Array;
//# sourceMappingURL=toRlp.d.ts.map