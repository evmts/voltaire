/**
 * @fileoverview GasEstimate primitive module for pre-execution gas estimation.
 *
 * @description
 * Gas estimates predict the gas required for a transaction before execution.
 * The `eth_estimateGas` RPC call returns this value. Estimates should include
 * a safety buffer (typically 10-20%) to account for state changes between
 * estimation and execution.
 *
 * Key concepts:
 * - Estimate: Predicted gas needed (from eth_estimateGas)
 * - Gas Limit: Maximum gas allowed (set in transaction)
 * - Gas Used: Actual gas consumed (after execution)
 *
 * @module GasEstimate
 * @since 0.0.1
 * @see {@link Gas} for gas units
 * @see {@link GasUsed} for consumed gas
 * @see {@link GasConstants} for operation costs
 */

export { GasEstimateSchema, type GasEstimateType } from './GasEstimateSchema.js'
export { from, withBuffer, toGasLimit, type GasEstimateError } from './from.js'
