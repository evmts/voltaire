/**
 * @fileoverview RIPEMD-160 cryptographic hashing service for Effect-based applications.
 * Provides 160-bit hash output, commonly used in Bitcoin address generation.
 * @module Ripemd160Service
 * @since 0.0.1
 */

import type { Ripemd160Hash } from "@tevm/voltaire";
import { Ripemd160 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * RIPEMD-160 hashing service for Effect-based applications.
 *
 * @description
 * RIPEMD-160 is a cryptographic hash function producing a 160-bit (20-byte) hash.
 * It is primarily used in Bitcoin for address generation when combined with SHA-256
 * (known as HASH160). The shorter output compared to SHA-256 makes addresses more
 * compact while maintaining adequate collision resistance.
 *
 * Common use cases:
 * - Bitcoin address generation (HASH160 = RIPEMD160(SHA256(data)))
 * - Legacy cryptocurrency protocols
 * - Data fingerprinting where 160-bit output is sufficient
 *
 * @example
 * ```typescript
 * import { Ripemd160Service, Ripemd160Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // Basic usage with service
 * const program = Effect.gen(function* () {
 *   const ripemd = yield* Ripemd160Service
 *   const hash = yield* ripemd.hash(new Uint8Array([1, 2, 3]))
 *   return hash // 20-byte hash
 * }).pipe(Effect.provide(Ripemd160Live))
 *
 * const result = await Effect.runPromise(program)
 * console.log(result.length) // 20
 * ```
 *
 * @see {@link Ripemd160Live} - Production layer using native RIPEMD-160
 * @see {@link Ripemd160Test} - Test layer with deterministic output
 * @see {@link hash} - Standalone hash function
 * @since 0.0.1
 */
export class Ripemd160Service extends Context.Tag("Ripemd160Service")<
	Ripemd160Service,
	{
		/**
		 * Computes the RIPEMD-160 hash of input data.
		 *
		 * @description
		 * Produces a fixed 20-byte hash regardless of input size. The hash is
		 * returned as a branded Ripemd160Hash type for type safety.
		 *
		 * @param data - The input bytes to hash
		 * @returns Effect containing the 20-byte hash as Ripemd160Hash
		 * @throws Never - This operation is infallible
		 */
		readonly hash: (data: Uint8Array) => Effect.Effect<Ripemd160Hash>;
	}
>() {}

/**
 * Production layer for Ripemd160Service using native RIPEMD-160 implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * RIPEMD-160 implementation from @tevm/voltaire.
 *
 * @example
 * ```typescript
 * import { Ripemd160Service, Ripemd160Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const hashData = Effect.gen(function* () {
 *   const ripemd = yield* Ripemd160Service
 *   return yield* ripemd.hash(new Uint8Array([1, 2, 3]))
 * }).pipe(Effect.provide(Ripemd160Live))
 * ```
 *
 * @see {@link Ripemd160Service} - The service definition
 * @since 0.0.1
 */
export const Ripemd160Live = Layer.succeed(Ripemd160Service, {
	hash: (data) => Effect.sync(() => Ripemd160.hash(data)),
});

/**
 * Test layer for Ripemd160Service returning deterministic zero-filled hashes.
 *
 * @description
 * Provides a mock implementation for unit testing that returns zero-filled
 * 20-byte arrays. Use this layer to test code that depends on Ripemd160Service
 * without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { Ripemd160Service, Ripemd160Test } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const ripemd = yield* Ripemd160Service
 *   const hash = yield* ripemd.hash(new Uint8Array([1, 2, 3]))
 *   // hash is Uint8Array(20) filled with zeros
 *   return hash
 * }).pipe(Effect.provide(Ripemd160Test))
 * ```
 *
 * @see {@link Ripemd160Service} - The service definition
 * @see {@link Ripemd160Live} - Production implementation
 * @since 0.0.1
 */
export const Ripemd160Test = Layer.succeed(Ripemd160Service, {
	hash: (_data) => Effect.sync(() => new Uint8Array(20) as Ripemd160Hash),
});
