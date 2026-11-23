/**
 * Decode an EIP-7928 RLP block access list.
 *
 * Strict: rejects trailing bytes, wrong shapes, padded integers, and any
 * ordering or uniqueness violation. A list that decodes re-encodes to the
 * same bytes, so its hash is safe to compare against the header.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {Uint8Array} data - RLP bytes, e.g. `ExecutionPayloadV4.blockAccessList`
 * @returns {import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If the list is malformed or non-canonical
 * @throws {import('../Rlp/RlpError.js').RlpDecodingError} If the bytes are not valid RLP
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * const bal = BlockAccessList.fromRlp(new Uint8Array([0xc0])); // []
 * ```
 */
export function fromRlp(data: Uint8Array): import("./BlockAccessListType.js").BlockAccessListType;
export type RlpData = import("../Rlp/RlpType.js").BrandedRlp;
//# sourceMappingURL=fromRlp.d.ts.map