/**
 * Create a FeeOracle instance
 *
 * @param {FeeOracleOptions} options
 * @returns {FeeOracleInstance}
 *
 * @example
 * ```typescript
 * const oracle = FeeOracle({ provider });
 *
 * // Get current fees
 * const feeData = await oracle.getFeeData();
 * console.log(`Base fee: ${feeData.baseFeePerGas}`);
 *
 * // Estimate EIP-1559 fees
 * const fees = await oracle.estimateEip1559Fees({ priority: 'high' });
 *
 * // Watch for fee updates
 * oracle.watchFees((data) => console.log(data));
 * ```
 */
export function FeeOracle(options: FeeOracleOptions): FeeOracleInstance;
export type FeeOracleOptions = import("./FeeOracleType.js").FeeOracleOptions;
export type FeeOracleInstance = import("./FeeOracleType.js").FeeOracle;
export type FeeDataType = import("./FeeOracleType.js").FeeDataType;
export type FeeEstimateOptions = import("./FeeOracleType.js").FeeEstimateOptions;
//# sourceMappingURL=FeeOracle.d.ts.map