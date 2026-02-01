/**
 * @fileoverview Effect-based Uint256 creation from bytes.
 * @module fromBytes
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from bytes (big-endian).
 *
 * @description
 * Interprets bytes as big-endian unsigned integer.
 * Fails if bytes exceed 32 bytes.
 *
 * @param bytes - Input bytes
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.fromBytes(new Uint8Array([0xff])))
 * // 255n
 * ```
 *
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.fromBytes(bytes),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
