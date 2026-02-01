/**
 * @fileoverview SHA-256 hash function for Effect-based applications.
 * Provides a functional Effect wrapper around the SHA-256 cryptographic hash.
 *
 * @module SHA256/hash
 * @since 0.0.1
 */

import type { SHA256Hash } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { SHA256Service } from "./SHA256Service.js";

/**
 * Computes the SHA-256 hash of the provided data.
 *
 * @description
 * SHA-256 is the standard cryptographic hash used in Bitcoin and many protocols.
 * It produces a 32-byte (256-bit) hash that is collision-resistant and one-way.
 *
 * The function requires a {@link SHA256Service} to be provided in the Effect context,
 * enabling dependency injection for testing and different implementations.
 *
 * SHA-256 is used in Ethereum as a precompile (address 0x02) and in various
 * cryptographic constructions including:
 * - Bitcoin block headers (double SHA-256)
 * - HMAC-SHA256 for key derivation
 * - Digital signature schemes
 *
 * @param {Uint8Array} data - The input bytes to hash. Can be any length.
 * @returns {Effect.Effect<SHA256Hash, never, SHA256Service>} An Effect that:
 *   - Succeeds with a 32-byte SHA256Hash (branded Uint8Array)
 *   - Never fails (infallible)
 *   - Requires SHA256Service in context
 *
 * @example Basic usage with Layer.provide
 * ```typescript
 * import { hash, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(SHA256Live)
 * )
 *
 * const result = await Effect.runPromise(program)
 * console.log(result) // Uint8Array(32) [...]
 * ```
 *
 * @example Hashing a string (UTF-8 encoded)
 * ```typescript
 * import { hash, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const message = new TextEncoder().encode('hello world')
 * const hashResult = await Effect.runPromise(
 *   hash(message).pipe(Effect.provide(SHA256Live))
 * )
 * ```
 *
 * @example Double SHA-256 (Bitcoin-style)
 * ```typescript
 * import { hash, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const doubleSha256 = (data: Uint8Array) =>
 *   Effect.gen(function* () {
 *     const first = yield* hash(data)
 *     return yield* hash(first)
 *   }).pipe(Effect.provide(SHA256Live))
 * ```
 *
 * @example Using test layer for deterministic results
 * ```typescript
 * import { hash, SHA256Test } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(SHA256Test)
 * )
 * // Returns zero-filled 32-byte array for testing
 * ```
 *
 * @see {@link SHA256Service} - The service interface for SHA-256 operations
 * @see {@link SHA256Live} - Production implementation layer
 * @see {@link SHA256Test} - Test implementation layer
 * @since 0.0.1
 */
export const hash = (
	data: Uint8Array,
): Effect.Effect<SHA256Hash, never, SHA256Service> =>
	Effect.gen(function* () {
		const sha256 = yield* SHA256Service;
		return yield* sha256.hash(data);
	});
