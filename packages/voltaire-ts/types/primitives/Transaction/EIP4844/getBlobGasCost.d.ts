/**
 * Calculate total blob gas cost.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP4844Type.js').TransactionEIP4844Type} tx - EIP-4844 transaction
 * @param {bigint} blobBaseFee - Blob base fee per gas
 * @returns {bigint} Total blob gas cost
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getBlobGasCost } from './primitives/Transaction/EIP4844/getBlobGasCost.js';
 * const cost = getBlobGasCost(tx, 1000000n);
 * ```
 */
export function getBlobGasCost(tx: import("./TransactionEIP4844Type.js").TransactionEIP4844Type, blobBaseFee: bigint): bigint;
//# sourceMappingURL=getBlobGasCost.d.ts.map