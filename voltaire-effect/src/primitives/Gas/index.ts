/**
 * @fileoverview Gas primitive module for EVM gas unit operations.
 * Gas represents the computational cost unit in Ethereum, measuring execution effort.
 * @module Gas
 * @since 0.0.1
 * @see {@link GasPrice} for gas pricing
 * @see {@link GasEstimate} for estimated gas amounts
 * @see {@link GasUsed} for consumed gas tracking
 */

export { GasSchema, type GasType } from './GasSchema.js'
export { from } from './from.js'
