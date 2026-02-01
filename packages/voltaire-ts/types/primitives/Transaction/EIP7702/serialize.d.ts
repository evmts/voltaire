/**
 * Serialize EIP-7702 transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction with type prefix
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/EIP7702/serialize.js';
 * const serialized = serialize(tx);
 * ```
 */
export function serialize(tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map