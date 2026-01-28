/**
 * @fileoverview Effect-based Uint256 creation from hex string.
 * @module fromHex
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from hex string.
 *
 * @description
 * Accepts hex strings with or without 0x prefix.
 * Fails on invalid hex or overflow.
 *
 * @param hex - Hex string
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.fromHex("0xde0b6b3a7640000"))
 * // 1000000000000000000n
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.fromHex(hex),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
