/**
 * @fileoverview EffectiveGasPrice primitive module for EIP-1559 calculations.
 *
 * @description
 * The effective gas price is the actual price per gas unit paid in an EIP-1559
 * transaction. It's calculated as:
 *
 * effectiveGasPrice = min(baseFee + priorityFee, maxFeePerGas)
 *
 * This value determines:
 * - What the user pays per gas unit
 * - The validator tip (effectiveGasPrice - baseFee)
 * - Total transaction cost (effectiveGasPrice × gasUsed)
 *
 * @module EffectiveGasPrice
 * @since 0.0.1
 * @see {@link BaseFeePerGas} for protocol base fee
 * @see {@link MaxFeePerGas} for user's max fee
 * @see {@link MaxPriorityFeePerGas} for user's tip
 * @see {@link GasUsed} for gas consumption
 * @see {@link FeeMarket} for fee market state
 */

export { EffectiveGasPriceSchema, type EffectiveGasPriceType } from './EffectiveGasPriceSchema.js'
export {
  from,
  fromGwei,
  fromWei,
  calculate,
  toGwei,
  toWei,
  toNumber,
  toBigInt,
  equals,
  compare,
  EffectiveGasPriceError
} from './from.js'
