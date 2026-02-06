/**
 * @fileoverview Pure function to compare EffectiveGasPrice for equality.
 * @module EffectiveGasPrice/equals
 * @since 0.1.0
 */

import type { EffectiveGasPriceType } from "./BigInt.js";

/**
 * Compares two effective gas prices for equality.
 *
 * @param a - First gas price
 * @param b - Second gas price
 * @returns True if equal
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(EffectiveGasPrice.Gwei)(22)
 * const b = S.decodeSync(EffectiveGasPrice.Gwei)(22)
 * EffectiveGasPrice.equals(a, b) // true
 * ```
 *
 * @since 0.1.0
 */
export const equals = (
	a: EffectiveGasPriceType,
	b: EffectiveGasPriceType,
): boolean => a === b;
