/**
 * @fileoverview Format wei to gwei string (9 decimals).
 * @module utils/Unit/formatGwei
 * @since 0.0.1
 */

import type * as Effect from "effect/Effect";
import type { UnitError } from "./errors.js";
import { formatUnits } from "./formatUnits.js";

/**
 * Formats wei to a gwei string (9 decimals).
 *
 * @param value - Wei value as bigint
 * @returns Effect yielding gwei string
 *
 * @example
 * ```typescript
 * // Format 20500000000n wei → "20.5" gwei
 * const gwei = yield* formatGwei(20500000000n)
 * ```
 */
export const formatGwei = (value: bigint): Effect.Effect<string, UnitError> =>
	formatUnits(value, 9);
