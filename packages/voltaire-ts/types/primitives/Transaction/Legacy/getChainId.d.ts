/**
 * Extract chain ID from v value (EIP-155).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./TransactionLegacyType.js').TransactionLegacyType}
 * @returns {bigint | null} Chain ID if EIP-155, null if pre-EIP-155
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getChainId } from './primitives/Transaction/Legacy/getChainId.js';
 * const chainId = getChainId.call(tx);
 * ```
 */
export function getChainId(this: import("./TransactionLegacyType.js").TransactionLegacyType): bigint | null;
//# sourceMappingURL=getChainId.d.ts.map