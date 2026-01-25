/**
 * @fileoverview Effect-based Bytes type check.
 * @module isBytes
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";
import * as Effect from "effect/Effect";

/**
 * Checks if value is a valid Bytes (Uint8Array).
 *
 * @param value - Value to check
 * @returns Effect yielding boolean
 *
 * @example
 * ```typescript
 * const isValid = Effect.runSync(Bytes.isBytes(someValue))
 * ```
 *
 * @since 0.0.1
 */
export const isBytes = (value: unknown): Effect.Effect<boolean> =>
	Effect.sync(() => VoltaireBytes.isBytes(value));
