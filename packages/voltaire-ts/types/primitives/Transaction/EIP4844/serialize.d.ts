/**
 * Serialize EIP-4844 transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP4844Type.js').TransactionEIP4844Type} tx - EIP-4844 transaction
 * @returns {Uint8Array} RLP encoded transaction with type prefix
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/EIP4844/serialize.js';
 * const encoded = serialize(tx);
 * ```
 */
export function serialize(tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map