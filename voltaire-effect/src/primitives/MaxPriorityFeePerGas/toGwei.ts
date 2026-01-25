/**
 * @fileoverview Pure function to convert MaxPriorityFeePerGas to gwei.
 * @module MaxPriorityFeePerGas/toGwei
 * @since 0.1.0
 */

import type { MaxPriorityFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

/**
 * Converts a priority fee from wei to gwei.
 *
 * @param value - Priority fee in wei
 * @returns Priority fee in gwei
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const tip = S.decodeSync(MaxPriorityFeePerGas.Gwei)(2)
 * const gwei = MaxPriorityFeePerGas.toGwei(tip) // 2n
 * ```
 *
 * @since 0.1.0
 */
export const toGwei = (value: MaxPriorityFeePerGasType): bigint => value / GWEI;
