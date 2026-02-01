/**
 * Deserialize RLP encoded EIP-1559 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction with type byte prefix
 * @returns {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} Deserialized transaction
 * @throws {DecodingError} If transaction format is invalid
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP1559/deserialize.js';
 * const tx = deserialize(encodedBytes);
 * ```
 */
export function deserialize(data: Uint8Array): import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559;
//# sourceMappingURL=deserialize.d.ts.map