/**
 * @fileoverview Effect-based Bytes equality check.
 * @module equals
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";
import * as Effect from "effect/Effect";

/**
 * Checks if two Bytes are equal.
 *
 * WARNING: Not constant-time. Do NOT use for cryptographic comparisons.
 *
 * @param a - First bytes
 * @param b - Second bytes
 * @returns Effect yielding boolean
 *
 * @example
 * ```typescript
 * const areEqual = Effect.runSync(Bytes.equals(bytes1, bytes2))
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: BytesType, b: BytesType): Effect.Effect<boolean> =>
	Effect.sync(() => VoltaireBytes.equals(a, b));
