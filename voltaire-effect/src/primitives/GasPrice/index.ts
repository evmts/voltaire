/**
 * @fileoverview GasPrice primitive module for gas pricing in wei.
 *
 * @description
 * Gas price represents the cost per unit of gas in wei. In legacy transactions,
 * this is the `gasPrice` field. In EIP-1559 transactions, the effective gas
 * price is calculated from `baseFee + priorityFee` capped by `maxFeePerGas`.
 *
 * Common units:
 * - 1 wei = 1 (smallest unit)
 * - 1 gwei = 1,000,000,000 wei (10^9)
 * - Gas prices are typically expressed in gwei (e.g., "20 gwei")
 *
 * @module GasPrice
 * @since 0.0.1
 * @see {@link Gas} for gas units
 * @see {@link BaseFeePerGas} for EIP-1559 base fee
 * @see {@link MaxFeePerGas} for EIP-1559 max fee
 * @see {@link MaxPriorityFeePerGas} for EIP-1559 priority fee
 * @see {@link EffectiveGasPrice} for calculated effective price
 */

export { GasPriceSchema, GasPriceFromGweiSchema, type GasPriceType } from './GasPriceSchema.js'
export { from, fromGwei, type GasPriceError } from './from.js'
