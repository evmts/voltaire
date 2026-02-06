/**
 * Deserialize RLP encoded EIP-7702 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction bytes with type prefix
 * @returns {import('../types.js').EIP7702} Deserialized transaction
 * @throws {DecodingError} If transaction is invalid or malformed
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP7702/deserialize.js';
 * const tx = deserialize(bytes);
 * ```
 */
export function deserialize(data: Uint8Array): import("../types.js").EIP7702;
//# sourceMappingURL=deserialize.d.ts.map