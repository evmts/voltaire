/**
 * @fileoverview Pure function to convert MaxFeePerGas to gwei.
 * @module MaxFeePerGas/toGwei
 * @since 0.1.0
 */

import type { MaxFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

/**
 * Converts a max fee from wei to gwei.
 *
 * @param value - Max fee in wei
 * @returns Max fee in gwei
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const maxFee = S.decodeSync(MaxFeePerGas.Gwei)(50)
 * const gwei = MaxFeePerGas.toGwei(maxFee) // 50n
 * ```
 *
 * @since 0.1.0
 */
export const toGwei = (value: MaxFeePerGasType): bigint => value / GWEI;
