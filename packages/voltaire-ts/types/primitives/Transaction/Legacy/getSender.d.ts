/**
 * Get sender address from transaction signature (Legacy).
 *
 * Recovers the sender address from transaction signature components (r, s, v).
 * Returns a BrandedAddress (20 bytes). Handles both EIP-155 (chainId in v) and
 * pre-EIP-155 signatures. Assumes transaction uses branded types with validated
 * signature components.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./TransactionLegacyType.js').TransactionLegacyType}
 * @returns {import('../../Address/index.js').AddressType} Sender address (20 bytes, branded)
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/Legacy/getSender.js';
 * const sender = getSender.call(tx);
 * ```
 */
export function getSender(this: import("./TransactionLegacyType.js").TransactionLegacyType): import("../../Address/index.js").AddressType;
//# sourceMappingURL=getSender.d.ts.map