/**
 * @fileoverview GasCosts module providing comprehensive gas cost tables.
 *
 * @description
 * Provides indexed gas cost tables for EVM opcodes, block gas limits by
 * hardfork, and transaction-related costs. Use for gas estimation and
 * understanding execution costs.
 *
 * Exports:
 * - GAS_COSTS: Opcode costs indexed by opcode value
 * - BLOCK_GAS_LIMITS: Block limits per hardfork
 * - TRANSACTION_COSTS: Base, data, and access list costs
 *
 * @module GasCosts
 * @since 0.0.1
 * @see {@link GasConstants} for individual constants
 * @see {@link Gas} for gas values
 */

export { GAS_COSTS, BLOCK_GAS_LIMITS, TRANSACTION_COSTS } from './GasCostsSchema.js'
