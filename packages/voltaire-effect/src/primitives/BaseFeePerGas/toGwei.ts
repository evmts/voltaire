/**
 * @fileoverview Pure function to convert BaseFeePerGas to gwei.
 * @module BaseFeePerGas/toGwei
 * @since 0.1.0
 */

import type { BaseFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

/**
 * Converts a base fee from wei to gwei.
 *
 * @param value - Base fee in wei
 * @returns Base fee in gwei
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const baseFee = S.decodeSync(BaseFeePerGas.Gwei)(25)
 * const gwei = BaseFeePerGas.toGwei(baseFee) // 25n
 * ```
 *
 * @since 0.1.0
 */
export const toGwei = (value: BaseFeePerGasType): bigint => value / GWEI;
