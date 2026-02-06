/**
 * @fileoverview Keccak-256 service definition and layer implementations for Effect.
 *
 * @description
 * Provides the KeccakService Effect Tag and both production (KeccakLive) and
 * test (KeccakTest) layer implementations. The service pattern enables
 * dependency injection for testability and flexibility.
 *
 * @module Keccak256/KeccakService
 * @since 0.0.1
 */

import type { Keccak256Hash } from "@tevm/voltaire";
import { Keccak256 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Shape interface for the Keccak-256 hashing service.
 *
 * @description
 * Defines the contract for Keccak-256 hash implementations.
 * Used as the service shape for {@link KeccakService}.
 *
 * @since 0.0.1
 */
export interface KeccakServiceShape {
	/**
	 * Computes the Keccak-256 hash of input data.
	 *
	 * @param {Uint8Array} data - The input bytes to hash (any length)
	 * @returns {Effect.Effect<Keccak256Hash>} Effect containing the 32-byte hash
	 */
	readonly hash: (data: Uint8Array) => Effect.Effect<Keccak256Hash>;
}

/**
 * Keccak-256 hashing service for Effect-based applications.
 *
 * @description
 * An Effect Context.Tag that provides the standard Ethereum hashing algorithm
 * used for addresses, signatures, state roots, and more. The service pattern
 * enables swapping implementations for testing or alternative backends.
 *
 * The service exposes a single `hash` method that takes arbitrary bytes and
 * produces a 32-byte Keccak-256 hash.
 *
 * @example Basic usage with Effect.gen
 * ```typescript
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   return yield* keccak.hash(new Uint8Array([1, 2, 3]))
 * }).pipe(Effect.provide(KeccakLive))
 *
 * const hash = await Effect.runPromise(program)
 * ```
 *
 * @example Chaining multiple hashes
 * ```typescript
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const doubleHash = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const first = yield* keccak.hash(new Uint8Array([1, 2, 3]))
 *   return yield* keccak.hash(first)
 * }).pipe(Effect.provide(KeccakLive))
 * ```
 *
 * @example Composing with other services
 * ```typescript
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 * import * as Layer from 'effect/Layer'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const secp = yield* Secp256k1Service
 *   const msgHash = yield* keccak.hash(message)
 *   return yield* secp.sign(msgHash, privateKey)
 * }).pipe(Effect.provide(Layer.merge(KeccakLive, Secp256k1Live)))
 * ```
 *
 * @see {@link KeccakLive} - Production implementation
 * @see {@link KeccakTest} - Test implementation
 * @see {@link hash} - Standalone hash function
 * @since 0.0.1
 */
export class KeccakService extends Context.Tag("KeccakService")<
	KeccakService,
	KeccakServiceShape
>() {}

/**
 * Production layer for KeccakService using native Keccak-256 implementation.
 *
 * @description
 * Provides the real Keccak-256 hash implementation from the voltaire library.
 * Use this layer in production applications for cryptographically secure hashing.
 *
 * The underlying implementation uses optimized native code (Zig/Rust) for
 * high-performance hashing.
 *
 * @example Providing the live layer
 * ```typescript
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   return yield* keccak.hash(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
 * })
 *
 * const result = await Effect.runPromise(program.pipe(Effect.provide(KeccakLive)))
 * ```
 *
 * @example Merging with other layers
 * ```typescript
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import { SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Layer from 'effect/Layer'
 *
 * const CryptoLive = Layer.merge(KeccakLive, SHA256Live)
 * ```
 *
 * @see {@link KeccakService} - The service tag
 * @see {@link KeccakTest} - Test implementation for unit tests
 * @since 0.0.1
 */
export const KeccakLive = Layer.succeed(KeccakService, {
	hash: (data) => Effect.sync(() => Keccak256.hash(data)),
});

/**
 * Test layer for KeccakService returning deterministic zero-filled hashes.
 *
 * @description
 * Provides a mock Keccak-256 implementation that always returns a 32-byte
 * array filled with zeros. Use for unit testing without cryptographic overhead
 * when the actual hash value doesn't matter for the test.
 *
 * This layer is useful for:
 * - Unit tests that need deterministic output
 * - Performance tests that want to isolate non-crypto logic
 * - Tests where the hash value is not validated
 *
 * @example Using in tests
 * ```typescript
 * import { KeccakService, KeccakTest } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 * import { describe, it, expect } from 'vitest'
 *
 * describe('MyService', () => {
 *   it('should hash data', async () => {
 *     const program = Effect.gen(function* () {
 *       const keccak = yield* KeccakService
 *       return yield* keccak.hash(new Uint8Array([1, 2, 3]))
 *     })
 *
 *     const result = await Effect.runPromise(program.pipe(Effect.provide(KeccakTest)))
 *     expect(result).toEqual(new Uint8Array(32)) // All zeros
 *   })
 * })
 * ```
 *
 * @see {@link KeccakService} - The service tag
 * @see {@link KeccakLive} - Production implementation
 * @since 0.0.1
 */
export const KeccakTest = Layer.succeed(KeccakService, {
	hash: (_data) => Effect.sync(() => new Uint8Array(32) as Keccak256Hash),
});
