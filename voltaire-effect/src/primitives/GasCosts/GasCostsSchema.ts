import { GasCosts } from '@tevm/voltaire'

/**
 * Comprehensive gas cost tables for EVM operations.
 * Includes opcode costs, block limits, and transaction costs per hardfork.
 * @since 0.0.1
 */

/**
 * Gas costs for each EVM opcode by hardfork.
 * @example
 * ```ts
 * import { GAS_COSTS } from 'voltaire-effect/primitives/GasCosts'
 *
 * const addCost = GAS_COSTS.ADD // 3n
 * ```
 * @since 0.0.1
 */
export const GAS_COSTS = GasCosts.GAS_COSTS

/**
 * Block gas limits per hardfork.
 * @example
 * ```ts
 * import { BLOCK_GAS_LIMITS } from 'voltaire-effect/primitives/GasCosts'
 *
 * const londonLimit = BLOCK_GAS_LIMITS.london // 30000000n
 * ```
 * @since 0.0.1
 */
export const BLOCK_GAS_LIMITS = GasCosts.BLOCK_GAS_LIMITS

/**
 * Transaction-related gas costs (base, data, access lists).
 * @example
 * ```ts
 * import { TRANSACTION_COSTS } from 'voltaire-effect/primitives/GasCosts'
 *
 * const baseCost = TRANSACTION_COSTS.base // 21000n
 * ```
 * @since 0.0.1
 */
export const TRANSACTION_COSTS = GasCosts.TRANSACTION_COSTS
