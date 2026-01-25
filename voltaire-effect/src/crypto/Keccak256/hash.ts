/**
 * @fileoverview Keccak-256 hash function for Effect-based applications.
 * Provides a functional Effect wrapper around the Keccak-256 cryptographic hash.
 *
 * @module Keccak256/hash
 * @since 0.0.1
 */

import type { Keccak256Hash } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { KeccakService } from "./KeccakService.js";

/**
 * Computes the Keccak-256 hash of the provided data.
 *
 * @description
 * This is the primary hash function used in Ethereum for addresses, transactions,
 * and state roots. Keccak-256 produces a 32-byte (256-bit) cryptographic hash that
 * is collision-resistant and one-way.
 *
 * The function requires a {@link KeccakService} to be provided in the Effect context,
 * enabling dependency injection for testing and different implementations.
 *
 * @param {Uint8Array} data - The input bytes to hash. Can be any length.
 * @returns {Effect.Effect<Keccak256Hash, never, KeccakService>} An Effect that:
 *   - Succeeds with a 32-byte Keccak256Hash (branded Uint8Array)
 *   - Never fails (infallible)
 *   - Requires KeccakService in context
 *
 * @example Basic usage with Layer.provide
 * ```typescript
 * import { hash, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(KeccakLive)
 * )
 *
 * const result = await Effect.runPromise(program)
 * console.log(result) // Uint8Array(32) [...]
 * ```
 *
 * @example Hashing a string (UTF-8 encoded)
 * ```typescript
 * import { hash, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const message = new TextEncoder().encode('hello world')
 * const hashResult = await Effect.runPromise(
 *   hash(message).pipe(Effect.provide(KeccakLive))
 * )
 * ```
 *
 * @example Using test layer for deterministic results
 * ```typescript
 * import { hash, KeccakTest } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(KeccakTest)
 * )
 * // Returns zero-filled 32-byte array for testing
 * ```
 *
 * @see {@link KeccakService} - The service interface for Keccak operations
 * @see {@link KeccakLive} - Production implementation layer
 * @see {@link KeccakTest} - Test implementation layer
 * @since 0.0.1
 */
export const hash = (
	data: Uint8Array,
): Effect.Effect<Keccak256Hash, never, KeccakService> =>
	Effect.gen(function* () {
		const keccak = yield* KeccakService;
		return yield* keccak.hash(data);
	});
