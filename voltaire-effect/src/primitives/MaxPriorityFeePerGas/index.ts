/**
 * @fileoverview MaxPriorityFeePerGas primitive module for EIP-1559 priority fees.
 *
 * @description
 * The priority fee (or "tip") is the portion of the gas fee paid to validators
 * in EIP-1559 transactions. It incentivizes validators to include transactions:
 *
 * effectiveGasPrice = min(baseFee + priorityFee, maxFeePerGas)
 *
 * Higher priority fees result in faster inclusion during congestion.
 * Unlike the base fee (which is burned), the priority fee goes to validators.
 *
 * @module MaxPriorityFeePerGas
 * @since 0.0.1
 * @see {@link BaseFeePerGas} for protocol-determined base fee
 * @see {@link MaxFeePerGas} for maximum total fee
 * @see {@link EffectiveGasPrice} for actual price paid
 * @see {@link FeeOracle} for fee estimation
 */

export { MaxPriorityFeePerGasSchema, MaxPriorityFeePerGasFromGweiSchema, type MaxPriorityFeePerGasType } from './MaxPriorityFeePerGasSchema.js'
export { from, fromGwei, toGwei } from './from.js'
