/**
 * @fileoverview Blake2 cryptographic hashing service for Effect-based applications.
 * Provides Blake2b hashing with configurable output length, faster than SHA-256.
 * @module Blake2Service
 * @since 0.0.1
 */

import type { Blake2Hash } from "@tevm/voltaire";
import { Blake2 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Blake2 hashing service for Effect-based applications.
 *
 * @description
 * Blake2b is a cryptographic hash function that is faster than SHA-256 while
 * providing equivalent or better security. It supports variable output lengths
 * from 1 to 64 bytes. Blake2 is used in Zcash, Argon2, and many other protocols.
 *
 * @example
 * ```typescript
 * import { Blake2Service, Blake2Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 * import * as Layer from 'effect/Layer'
 *
 * // Basic usage with service
 * const program = Effect.gen(function* () {
 *   const blake2 = yield* Blake2Service
 *   const hash32 = yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
 *   const hash64 = yield* blake2.hash(new Uint8Array([4, 5, 6])) // default 64 bytes
 *   return { hash32, hash64 }
 * }).pipe(Effect.provide(Blake2Live))
 *
 * // Run the effect
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @see {@link Blake2Live} - Production layer using native Blake2b
 * @see {@link Blake2Test} - Test layer with deterministic output
 * @see {@link hash} - Standalone hash function
 * @since 0.0.1
 */
export class Blake2Service extends Context.Tag("Blake2Service")<
	Blake2Service,
	{
		/**
		 * Computes the Blake2b hash of input data.
		 *
		 * @description
		 * Hashes arbitrary data using Blake2b algorithm. Output length is configurable
		 * from 1 to 64 bytes, defaulting to 64 bytes for maximum security.
		 *
		 * @param data - The input bytes to hash
		 * @param outputLength - Desired output length in bytes (1-64, default: 64)
		 * @returns Effect containing the hash as a branded Blake2Hash type
		 * @throws Never - This operation is infallible
		 */
		readonly hash: (
			data: Uint8Array,
			outputLength?: number,
		) => Effect.Effect<Blake2Hash>;
	}
>() {}

/**
 * Production layer for Blake2Service using native Blake2b implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * Blake2b implementation from @tevm/voltaire.
 *
 * @example
 * ```typescript
 * import { Blake2Service, Blake2Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const hashData = Effect.gen(function* () {
 *   const blake2 = yield* Blake2Service
 *   return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
 * }).pipe(Effect.provide(Blake2Live))
 * ```
 *
 * @see {@link Blake2Service} - The service definition
 * @since 0.0.1
 */
export const Blake2Live = Layer.succeed(Blake2Service, {
	hash: (data, outputLength = 64) =>
		Effect.sync(() => Blake2.hash(data, outputLength)),
});

/**
 * Test layer for Blake2Service returning deterministic zero-filled hashes.
 *
 * @description
 * Provides a mock implementation for unit testing that returns zero-filled
 * arrays of the requested length. Use this layer to test code that depends
 * on Blake2Service without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { Blake2Service, Blake2Test } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const blake2 = yield* Blake2Service
 *   const hash = yield* blake2.hash(new Uint8Array([1, 2, 3]), 32)
 *   // hash is Uint8Array(32) filled with zeros
 *   return hash
 * }).pipe(Effect.provide(Blake2Test))
 * ```
 *
 * @see {@link Blake2Service} - The service definition
 * @see {@link Blake2Live} - Production implementation
 * @since 0.0.1
 */
export const Blake2Test = Layer.succeed(Blake2Service, {
	hash: (_data, outputLength = 64) =>
		Effect.sync(() => new Uint8Array(outputLength) as Blake2Hash),
});
