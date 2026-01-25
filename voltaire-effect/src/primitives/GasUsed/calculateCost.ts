/**
 * @fileoverview Pure function to calculate transaction cost from gas used.
 * @module GasUsed/calculateCost
 * @since 0.1.0
 */

import { GasUsed } from "@tevm/voltaire";

/**
 * Calculates the total cost from gas used and gas price.
 *
 * Computes the transaction fee as: gasUsed × gasPrice.
 * This is the actual ETH cost of a transaction after execution.
 *
 * @param gasUsed - Amount of gas consumed (from receipt)
 * @param gasPrice - Effective price per gas unit in wei
 * @returns Total cost in wei
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 *
 * // Simple transfer: 21000 gas at 20 gwei
 * const cost = GasUsed.calculateCost(21000n, 20_000_000_000n)
 * // 420_000_000_000_000n wei = 0.00042 ETH
 * ```
 *
 * @since 0.1.0
 */
export const calculateCost = (
	gasUsed: bigint | number | string,
	gasPrice: bigint,
): bigint => GasUsed.calculateCost(gasUsed, gasPrice);
