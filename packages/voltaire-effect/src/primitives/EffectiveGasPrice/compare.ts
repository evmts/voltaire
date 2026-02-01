/**
 * @fileoverview Pure function to compare EffectiveGasPrice values.
 * @module EffectiveGasPrice/compare
 * @since 0.1.0
 */

import type { EffectiveGasPriceType } from "./BigInt.js";

/**
 * Compares two effective gas prices.
 *
 * @param a - First gas price
 * @param b - Second gas price
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(EffectiveGasPrice.Gwei)(20)
 * const b = S.decodeSync(EffectiveGasPrice.Gwei)(22)
 * EffectiveGasPrice.compare(a, b) // -1
 * ```
 *
 * @since 0.1.0
 */
export const compare = (
	a: EffectiveGasPriceType,
	b: EffectiveGasPriceType,
): -1 | 0 | 1 => (a < b ? -1 : a > b ? 1 : 0);
