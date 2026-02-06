/**
 * Serialize EIP-2930 transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction bytes
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/EIP2930/serialize.js';
 * const bytes = serialize(tx);
 * ```
 */
export function serialize(tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map