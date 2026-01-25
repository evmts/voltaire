/**
 * @fileoverview FeeOracle primitive module for gas fee estimation.
 *
 * @description
 * FeeOracle provides fee estimation data for EIP-1559 transactions. It
 * encapsulates the recommended fee parameters:
 *
 * - baseFee: Current block base fee
 * - priorityFee: Suggested validator tip
 * - maxFee: Recommended maximum fee
 * - estimatedTime: Expected inclusion time (optional)
 *
 * Use with gas price oracles or fee estimation services to get optimal
 * transaction parameters for current network conditions.
 *
 * @module FeeOracle
 * @since 0.0.1
 * @see {@link BaseFeePerGas} for base fee type
 * @see {@link MaxFeePerGas} for max fee type
 * @see {@link MaxPriorityFeePerGas} for priority fee type
 * @see {@link EffectiveGasPrice} for calculated price
 * @see {@link FeeMarket} for fee market state
 */

export { FeeOracleSchema, type FeeOracleType, type FeeOracleInput } from './FeeOracleSchema.js'
export { from, validate, effectiveGasPrice, withMultiplier, FeeOracleError } from './from.js'
