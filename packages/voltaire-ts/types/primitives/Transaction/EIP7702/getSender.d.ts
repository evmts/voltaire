/**
 * Get sender address from signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction with signature
 * @returns {import('../../Address/index.js').AddressType} Recovered sender address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/EIP7702/getSender.js';
 * const sender = getSender(tx);
 * ```
 */
export function getSender(tx: import("./BrandedTransactionEIP7702.js").BrandedTransactionEIP7702): import("../../Address/index.js").AddressType;
//# sourceMappingURL=getSender.d.ts.map