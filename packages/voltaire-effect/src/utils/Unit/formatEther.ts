/**
 * @fileoverview Format wei to ether string (18 decimals).
 * @module utils/Unit/formatEther
 * @since 0.0.1
 */

import type * as Effect from "effect/Effect";
import type { UnitError } from "./errors.js";
import { formatUnits } from "./formatUnits.js";

/**
 * Formats wei to an ether string (18 decimals).
 *
 * @param value - Wei value as bigint
 * @returns Effect yielding ether string
 *
 * @example
 * ```typescript
 * // Format 1500000000000000000n wei → "1.5" ETH
 * const ether = yield* formatEther(1500000000000000000n)
 * ```
 */
export const formatEther = (value: bigint): Effect.Effect<string, UnitError> =>
	formatUnits(value, 18);
