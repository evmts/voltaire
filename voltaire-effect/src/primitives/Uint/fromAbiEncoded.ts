/**
 * @fileoverview Effect-based Uint256 creation from ABI-encoded bytes.
 * @module fromAbiEncoded
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from ABI-encoded bytes (32 bytes, big-endian).
 *
 * @param data - 32-byte ABI-encoded data
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.fromAbiEncoded(bytes))
 * ```
 *
 * @since 0.0.1
 */
export const fromAbiEncoded = (
	data: Uint8Array,
): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.fromAbiEncoded(data),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
