/**
 * @fileoverview Parse ether string to wei (18 decimals).
 * @module utils/Unit/parseEther
 * @since 0.0.1
 */

import type * as Effect from "effect/Effect";
import type { UnitError } from "./errors.js";
import { parseUnits } from "./parseUnits.js";

/**
 * Parses an ether string to wei (18 decimals).
 *
 * @param value - Ether string (e.g., "1.5")
 * @returns Effect yielding wei as bigint
 *
 * @example
 * ```typescript
 * // Parse "1.5" ETH → 1500000000000000000n wei
 * const wei = yield* parseEther("1.5")
 * ```
 */
export const parseEther = (value: string): Effect.Effect<bigint, UnitError> =>
	parseUnits(value, 18);
