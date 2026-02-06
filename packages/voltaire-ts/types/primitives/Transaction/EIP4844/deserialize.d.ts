/**
 * Deserialize RLP encoded EIP-4844 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction with type prefix
 * @returns {import('../types.js').EIP4844} Deserialized transaction
 * @throws {DecodingError} If data is invalid or malformed
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP4844/deserialize.js';
 * const tx = deserialize(encodedData);
 * ```
 */
export function deserialize(data: Uint8Array): import("../types.js").EIP4844;
//# sourceMappingURL=deserialize.d.ts.map