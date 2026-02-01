/**
 * Serialize EIP-1559 transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction with type byte prefix
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/EIP1559/serialize.js';
 * const encoded = serialize(tx);
 * ```
 */
export function serialize(tx: import("./TransactionEIP1559Type.js").BrandedTransactionEIP1559): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map