/**
 * Calculate transaction intrinsic gas cost
 *
 * @param {Uint8Array} data - Transaction calldata
 * @param {boolean} isCreate - Whether transaction creates a contract
 * @returns {bigint} Intrinsic gas cost
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([0, 1, 2, 0, 0]);
 * const cost = calculateTxIntrinsicGas(data, false);
 * // 21000 + (3 * 4) + (2 * 16) = 21044 gas
 * ```
 */
export function calculateTxIntrinsicGas(data: Uint8Array, isCreate: boolean): bigint;
//# sourceMappingURL=calculateTxIntrinsicGas.d.ts.map