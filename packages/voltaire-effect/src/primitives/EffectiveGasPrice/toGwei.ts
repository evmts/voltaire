/**
 * @fileoverview Pure function to convert EffectiveGasPrice to gwei.
 * @module EffectiveGasPrice/toGwei
 * @since 0.1.0
 */

import type { EffectiveGasPriceType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

/**
 * Converts an effective gas price from wei to gwei.
 *
 * @param value - Effective gas price in wei
 * @returns Effective gas price in gwei
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * const price = S.decodeSync(EffectiveGasPrice.Gwei)(22)
 * const gwei = EffectiveGasPrice.toGwei(price) // 22n
 * ```
 *
 * @since 0.1.0
 */
export const toGwei = (value: EffectiveGasPriceType): bigint => value / GWEI;
