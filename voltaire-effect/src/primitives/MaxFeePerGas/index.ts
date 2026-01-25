/**
 * @fileoverview MaxFeePerGas primitive module for EIP-1559 maximum fees.
 *
 * @description
 * MaxFeePerGas is the maximum total fee per gas a user is willing to pay
 * in an EIP-1559 transaction. The actual fee paid is:
 *
 * effectiveGasPrice = min(baseFee + priorityFee, maxFeePerGas)
 *
 * Setting maxFeePerGas protects users from sudden base fee spikes.
 * The difference between maxFeePerGas and effectiveGasPrice is refunded.
 *
 * @module MaxFeePerGas
 * @since 0.0.1
 * @see {@link BaseFeePerGas} for protocol-determined base fee
 * @see {@link MaxPriorityFeePerGas} for validator tip
 * @see {@link EffectiveGasPrice} for actual price paid
 * @see {@link FeeMarket} for fee market state
 */

export { MaxFeePerGasSchema, MaxFeePerGasFromGweiSchema, type MaxFeePerGasType } from './MaxFeePerGasSchema.js'
export { from, fromGwei, toGwei } from './from.js'
