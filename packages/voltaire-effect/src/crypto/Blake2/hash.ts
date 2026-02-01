/**
 * @fileoverview Standalone Blake2b hash function for Effect-based applications.
 * @module Blake2/hash
 * @since 0.0.1
 */

import type { Blake2Hash } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { Blake2Service } from "./Blake2Service.js";

/**
 * Computes the Blake2b hash of the provided data.
 *
 * @description
 * Blake2 is a fast cryptographic hash function that outperforms SHA-256 while
 * providing equivalent or better security. This function requires the Blake2Service
 * to be provided in the Effect context.
 *
 * Blake2b supports output lengths from 1 to 64 bytes:
 * - 32 bytes: Common for checksums and identifiers
 * - 64 bytes: Maximum security, default output
 *
 * @param data - The input bytes to hash
 * @param outputLength - Desired output length in bytes (1-64, default: 64)
 * @returns Effect containing the Blake2b hash, requiring Blake2Service
 *
 * @example
 * ```typescript
 * import { hash, Blake2Live } from 'voltaire-effect/crypto/Blake2'
 * import * as Effect from 'effect/Effect'
 *
 * // Hash with default 64-byte output
 * const hash64 = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(Blake2Live)
 * )
 *
 * // Hash with 32-byte output
 * const hash32 = hash(new Uint8Array([1, 2, 3]), 32).pipe(
 *   Effect.provide(Blake2Live)
 * )
 *
 * // Execute the effect
 * const result = await Effect.runPromise(hash32)
 * console.log(result.length) // 32
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link Blake2Service} - The underlying service
 * @see {@link Blake2Live} - Production layer
 * @since 0.0.1
 */
export const hash = (
	data: Uint8Array,
	outputLength?: number,
): Effect.Effect<Blake2Hash, never, Blake2Service> =>
	Effect.gen(function* () {
		const blake2 = yield* Blake2Service;
		return yield* blake2.hash(data, outputLength);
	});
