/**
 * @fileoverview BaseFeePerGas primitive module for EIP-1559 base fees.
 *
 * @description
 * The base fee is a protocol-determined minimum fee per gas unit, introduced
 * in EIP-1559. It adjusts dynamically based on network congestion:
 * - Increases when blocks are >50% full
 * - Decreases when blocks are <50% full
 * - Maximum change: ±12.5% per block
 *
 * The base fee is burned (not paid to validators), reducing ETH supply.
 *
 * @module BaseFeePerGas
 * @since 0.0.1
 * @see {@link MaxFeePerGas} for maximum fee willing to pay
 * @see {@link MaxPriorityFeePerGas} for validator tip
 * @see {@link EffectiveGasPrice} for actual price paid
 * @see {@link FeeMarket} for fee market state
 */

export { BaseFeePerGasSchema, BaseFeePerGasFromGweiSchema, type BaseFeePerGasType } from './BaseFeePerGasSchema.js'
export { from, fromGwei, toGwei } from './from.js'
