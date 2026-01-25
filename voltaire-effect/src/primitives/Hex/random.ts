/**
 * @fileoverview Hex random generation function.
 * Generates a random hex string of specified size.
 * @module voltaire-effect/primitives/Hex/random
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Generate a random hex string of specified byte size.
 *
 * @description
 * Creates a cryptographically random hex string of the specified size in bytes.
 * Uses the Web Crypto API for randomness. This operation is infallible.
 *
 * @param {number} size - Size in bytes
 * @returns {Effect.Effect<HexType, never>} Effect that always succeeds with random hex
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Generate 32 random bytes
 * const random = await Effect.runPromise(Hex.random(32))
 * // e.g., '0x7f3a9b2c...' (64 hex chars)
 * ```
 *
 * @since 0.0.1
 */
export const random = (size: number): Effect.Effect<HexType, never> =>
	Effect.succeed(VoltaireHex.random(size));
