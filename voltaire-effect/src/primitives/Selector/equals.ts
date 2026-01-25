/**
 * @fileoverview Pure function for Selector equality check.
 * @module Selector/equals
 * @since 0.1.0
 */

import { Selector } from "@tevm/voltaire";
import type { SelectorType } from "./SelectorSchema.js";

/**
 * Compares two Selectors for equality.
 *
 * @param a - First selector
 * @param b - Second selector
 * @returns true if selectors are equal
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(Selector.Hex)('0xa9059cbb')
 * const b = S.decodeSync(Selector.Signature)('transfer(address,uint256)')
 * Selector.equals(a, b) // true
 * ```
 *
 * @since 0.1.0
 */
export const equals = (a: SelectorType, b: SelectorType): boolean =>
	Selector.equals(
		a as unknown as Parameters<typeof Selector.equals>[0],
		b as unknown as Parameters<typeof Selector.equals>[0],
	);
