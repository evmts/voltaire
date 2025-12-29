/**
 * FeeOracle - Gas price estimation and fee data
 *
 * Provides current gas prices, EIP-1559 fee estimation, and fee watching.
 *
 * @module primitives/FeeOracle
 *
 * @example
 * ```typescript
 * import { FeeOracle } from '@tevm/voltaire/FeeOracle';
 *
 * const oracle = FeeOracle({ provider });
 *
 * // Get current fees
 * const feeData = await oracle.getFeeData();
 * console.log(`Gas price: ${feeData.gasPrice}`);
 * console.log(`Base fee: ${feeData.baseFeePerGas}`);
 *
 * // Estimate EIP-1559 fees with priority
 * const fees = await oracle.estimateEip1559Fees({ priority: 'high' });
 * const tx = {
 *   maxFeePerGas: fees.maxFeePerGas,
 *   maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
 * };
 *
 * // Watch for fee updates
 * const unsubscribe = oracle.watchFees(
 *   (data) => console.log(`New base fee: ${data.baseFeePerGas}`),
 *   { pollingInterval: 12000 }
 * );
 * ```
 */

export type {
	FeeDataType,
	FeeEstimateOptions,
	FeeOracle as FeeOracleInstance,
	FeeOracleOptions,
	FeeOracleFactory,
} from "./FeeOracleType.js";

export { FeeOracle } from "./FeeOracle.js";
