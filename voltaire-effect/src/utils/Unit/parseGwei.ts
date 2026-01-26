/**
 * @fileoverview Parse gwei string to wei (9 decimals).
 * @module utils/Unit/parseGwei
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { type UnitError } from "./errors.js";
import { parseUnits } from "./parseUnits.js";

/**
 * Parses a gwei string to wei (9 decimals).
 *
 * @param value - Gwei string (e.g., "20.5")
 * @returns Effect yielding wei as bigint
 *
 * @example
 * ```typescript
 * // Parse "20.5" gwei → 20500000000n wei
 * const wei = yield* parseGwei("20.5")
 * ```
 */
export const parseGwei = (value: string): Effect.Effect<bigint, UnitError> =>
	parseUnits(value, 9);
