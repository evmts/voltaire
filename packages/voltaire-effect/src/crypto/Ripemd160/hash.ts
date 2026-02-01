/**
 * @fileoverview Standalone RIPEMD-160 hash function for Effect-based applications.
 * @module Ripemd160/hash
 * @since 0.0.1
 */

import type { Ripemd160Hash } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { Ripemd160Service } from "./Ripemd160Service.js";

/**
 * Computes the RIPEMD-160 hash of the provided data.
 *
 * @description
 * RIPEMD-160 produces a fixed 160-bit (20-byte) hash regardless of input size.
 * It is primarily used in Bitcoin for address generation when combined with SHA-256,
 * creating the HASH160 function: RIPEMD160(SHA256(data)).
 *
 * This function requires the Ripemd160Service to be provided in the Effect context.
 *
 * @param data - The input bytes to hash
 * @returns Effect containing the 20-byte RIPEMD-160 hash, requiring Ripemd160Service
 *
 * @example
 * ```typescript
 * import { hash, Ripemd160Live } from 'voltaire-effect/crypto/Ripemd160'
 * import * as Effect from 'effect/Effect'
 *
 * // Hash some data
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(Ripemd160Live)
 * )
 *
 * // Execute the effect
 * const result = await Effect.runPromise(program)
 * console.log(result.length) // 20
 *
 * // Bitcoin-style HASH160 (combine with SHA256)
 * import { hash as sha256 } from 'voltaire-effect/crypto/SHA256'
 *
 * const hash160 = Effect.gen(function* () {
 *   const sha = yield* sha256(publicKey)
 *   return yield* hash(sha)
 * })
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link Ripemd160Service} - The underlying service
 * @see {@link Ripemd160Live} - Production layer
 * @since 0.0.1
 */
export const hash = (
	data: Uint8Array,
): Effect.Effect<Ripemd160Hash, never, Ripemd160Service> =>
	Effect.gen(function* () {
		const ripemd160 = yield* Ripemd160Service;
		return yield* ripemd160.hash(data);
	});
