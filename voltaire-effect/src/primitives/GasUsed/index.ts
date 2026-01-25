/**
 * @fileoverview GasUsed primitive module for tracking consumed gas.
 *
 * @description
 * GasUsed represents the actual amount of gas consumed during transaction
 * execution. This value is included in transaction receipts and is used
 * to calculate the actual transaction fee paid.
 *
 * Fee calculation: fee = gasUsed × effectiveGasPrice
 *
 * @module GasUsed
 * @since 0.0.1
 * @see {@link Gas} for gas units
 * @see {@link GasEstimate} for pre-execution estimates
 * @see {@link GasRefund} for storage clearing refunds
 * @see {@link EffectiveGasPrice} for price calculation
 */

export { Schema, type GasUsedType } from './GasUsedSchema.js'
export { from, calculateCost, GasUsedError } from './from.js'
