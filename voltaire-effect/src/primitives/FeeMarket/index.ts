/**
 * @fileoverview FeeMarket primitive module for EIP-1559 and EIP-4844 fee calculations.
 *
 * @description
 * Provides comprehensive fee market state management for Ethereum's dynamic
 * fee mechanism. Includes EIP-1559 base fee calculations and EIP-4844 blob
 * fee calculations for data availability.
 *
 * Key concepts:
 * - EIP-1559: Dynamic base fee adjusting to target 50% block utilization
 * - EIP-4844: Blob gas pricing for data availability (proto-danksharding)
 * - Base fee: Protocol minimum, burned (not paid to validators)
 * - Blob base fee: Separate market for blob data pricing
 *
 * @module FeeMarket
 * @since 0.0.1
 * @see {@link BaseFeePerGas} for base fee type
 * @see {@link EffectiveGasPrice} for calculated effective price
 * @see {@link FeeOracle} for fee estimation service
 */

export { FeeMarketSchema, type FeeMarketType, type FeeMarketInput } from './FeeMarketSchema.js'
export {
  from,
  BaseFee,
  BlobBaseFee,
  calculateExcessBlobGas,
  calculateTxFee,
  calculateBlobTxFee,
  canIncludeTx,
  nextState,
  validateState,
  weiToGwei,
  gweiToWei,
  Eip1559,
  Eip4844,
  FeeMarketError
} from './from.js'
