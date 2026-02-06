/**
 * Get sender address from EIP-2930 transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} tx - Transaction
 * @returns {import('../../Address/index.js').AddressType} Sender address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP2930/getSender.js';
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx: import("./TransactionEIP2930Type.js").TransactionEIP2930Type): import("../../Address/index.js").AddressType;
//# sourceMappingURL=getSender.d.ts.map