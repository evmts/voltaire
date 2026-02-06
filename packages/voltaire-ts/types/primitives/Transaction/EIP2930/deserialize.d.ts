/**
 * Deserialize RLP encoded EIP-2930 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction bytes
 * @returns {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} Deserialized transaction
 * @throws {DecodingError} If data is invalid or malformed
 * @throws {InvalidFormatError} If access list format is invalid
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP2930/deserialize.js';
 * const tx = deserialize(bytes);
 * ```
 */
export function deserialize(data: Uint8Array): import("./TransactionEIP2930Type.js").TransactionEIP2930Type;
//# sourceMappingURL=deserialize.d.ts.map