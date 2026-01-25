/**
 * @fileoverview Comprehensive gas cost tables for EVM execution.
 *
 * @description
 * Provides indexed gas cost tables derived from the Ethereum Yellow Paper
 * and subsequent EIPs. These tables enable accurate gas estimation for
 * any EVM operation or transaction.
 *
 * @module GasCosts/GasCostsSchema
 * @since 0.0.1
 * @see {@link GasConstants} for individual constants
 */

import { GasCosts } from '@tevm/voltaire'

/**
 * Comprehensive gas cost tables for EVM operations.
 *
 * @description
 * Includes opcode costs, block limits, and transaction costs per hardfork.
 * These tables are the definitive source for gas calculation in the EVM.
 *
 * @since 0.0.1
 */

/**
 * Gas costs for each EVM opcode.
 *
 * @description
 * Maps opcode names to their gas costs. Costs may vary by hardfork for
 * some opcodes (e.g., SLOAD, SSTORE).
 *
 * @example
 * ```typescript
 * import { GAS_COSTS } from 'voltaire-effect/primitives/GasCosts'
 *
 * // Basic operations
 * const addCost = GAS_COSTS.ADD        // 3n
 * const mulCost = GAS_COSTS.MUL        // 5n
 * const sha3Cost = GAS_COSTS.SHA3      // 30n (base)
 *
 * // Storage operations (most expensive)
 * const sloadCost = GAS_COSTS.SLOAD    // 2100n (cold)
 * const sstoreCost = GAS_COSTS.SSTORE  // dynamic (20000n set, 5000n update)
 *
 * // Calculate total gas for a sequence
 * const totalGas = GAS_COSTS.PUSH1 + GAS_COSTS.ADD + GAS_COSTS.POP
 * ```
 *
 * @see https://www.evm.codes/ for interactive opcode reference
 * @since 0.0.1
 */
export const GAS_COSTS = GasCosts.GAS_COSTS

/**
 * Block gas limits per hardfork.
 *
 * @description
 * Defines the maximum gas allowed in a block for each Ethereum hardfork.
 * Limits have increased over time to allow more transactions per block.
 *
 * @example
 * ```typescript
 * import { BLOCK_GAS_LIMITS } from 'voltaire-effect/primitives/GasCosts'
 *
 * // Evolution of block limits
 * const frontierLimit = BLOCK_GAS_LIMITS.frontier   // 5000n
 * const londonLimit = BLOCK_GAS_LIMITS.london       // 30000000n
 * const currentLimit = BLOCK_GAS_LIMITS.shanghai    // 30000000n
 *
 * // Check if transaction fits in block
 * function canInclude(txGas: bigint, hardfork: keyof typeof BLOCK_GAS_LIMITS): boolean {
 *   return txGas <= BLOCK_GAS_LIMITS[hardfork]
 * }
 * ```
 *
 * @since 0.0.1
 */
export const BLOCK_GAS_LIMITS = GasCosts.BLOCK_GAS_LIMITS

/**
 * Transaction-related gas costs (base, data, access lists).
 *
 * @description
 * Defines gas costs for transaction components:
 * - base: Intrinsic cost for any transaction (21000)
 * - dataZero: Cost per zero byte in calldata (4)
 * - dataNonZero: Cost per non-zero byte in calldata (16)
 * - accessListAddress: Cost per address in access list (2400)
 * - accessListStorageKey: Cost per storage key in access list (1900)
 *
 * @example
 * ```typescript
 * import { TRANSACTION_COSTS } from 'voltaire-effect/primitives/GasCosts'
 *
 * // Calculate transaction intrinsic gas
 * function intrinsicGas(data: Uint8Array, accessListAddresses: number, accessListKeys: number): bigint {
 *   let gas = TRANSACTION_COSTS.base
 *
 *   for (const byte of data) {
 *     gas += byte === 0 ? TRANSACTION_COSTS.dataZero : TRANSACTION_COSTS.dataNonZero
 *   }
 *
 *   gas += BigInt(accessListAddresses) * TRANSACTION_COSTS.accessListAddress
 *   gas += BigInt(accessListKeys) * TRANSACTION_COSTS.accessListStorageKey
 *
 *   return gas
 * }
 * ```
 *
 * @since 0.0.1
 */
export const TRANSACTION_COSTS = GasCosts.TRANSACTION_COSTS
