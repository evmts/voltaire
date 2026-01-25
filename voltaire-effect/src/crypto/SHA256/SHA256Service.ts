/**
 * @fileoverview SHA-256 service definition and layer implementations for Effect.
 *
 * @description
 * Provides the SHA256Service Effect Tag and both production (SHA256Live) and
 * test (SHA256Test) layer implementations. The service pattern enables
 * dependency injection for testability and flexibility.
 *
 * @module SHA256/SHA256Service
 * @since 0.0.1
 */

import type { SHA256Hash } from "@tevm/voltaire";
import { SHA256 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Shape interface for the SHA-256 hashing service.
 *
 * @description
 * Defines the contract for SHA-256 hash implementations.
 * Used as the service shape for {@link SHA256Service}.
 *
 * @since 0.0.1
 */
export interface SHA256ServiceShape {
	/**
	 * Computes the SHA-256 hash of input data.
	 *
	 * @param {Uint8Array} data - The input bytes to hash (any length)
	 * @returns {Effect.Effect<SHA256Hash>} Effect containing the 32-byte hash
	 */
	readonly hash: (data: Uint8Array) => Effect.Effect<SHA256Hash>;
}

/**
 * SHA-256 hashing service for Effect-based applications.
 *
 * @description
 * An Effect Context.Tag that provides the standard SHA-256 hashing algorithm
 * used in Bitcoin, SSL/TLS, and many cryptographic protocols. The service
 * pattern enables swapping implementations for testing or alternative backends.
 *
 * The service exposes a single `hash` method that takes arbitrary bytes and
 * produces a 32-byte SHA-256 hash.
 *
 * In Ethereum, SHA-256 is available as a precompile at address 0x02.
 *
 * @example Basic usage with Effect.gen
 * ```typescript
 * import { SHA256Service, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sha256 = yield* SHA256Service
 *   return yield* sha256.hash(new Uint8Array([1, 2, 3]))
 * }).pipe(Effect.provide(SHA256Live))
 *
 * const hash = await Effect.runPromise(program)
 * ```
 *
 * @example Double SHA-256 (Bitcoin-style)
 * ```typescript
 * import { SHA256Service, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const doubleSha256 = Effect.gen(function* () {
 *   const sha256 = yield* SHA256Service
 *   const first = yield* sha256.hash(new Uint8Array([1, 2, 3]))
 *   return yield* sha256.hash(first)
 * }).pipe(Effect.provide(SHA256Live))
 * ```
 *
 * @example Composing with other services
 * ```typescript
 * import { SHA256Service, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 * import * as Layer from 'effect/Layer'
 *
 * const program = Effect.gen(function* () {
 *   const sha256 = yield* SHA256Service
 *   const keccak = yield* KeccakService
 *   const sha256Hash = yield* sha256.hash(data)
 *   return yield* keccak.hash(sha256Hash)
 * }).pipe(Effect.provide(Layer.merge(SHA256Live, KeccakLive)))
 * ```
 *
 * @see {@link SHA256Live} - Production implementation
 * @see {@link SHA256Test} - Test implementation
 * @see {@link hash} - Standalone hash function
 * @since 0.0.1
 */
export class SHA256Service extends Context.Tag("SHA256Service")<
	SHA256Service,
	SHA256ServiceShape
>() {}

/**
 * Production layer for SHA256Service using native SHA-256 implementation.
 *
 * @description
 * Provides the real SHA-256 hash implementation from the voltaire library.
 * Use this layer in production applications for cryptographically secure hashing.
 *
 * The underlying implementation uses optimized native code (Zig/Rust) for
 * high-performance hashing.
 *
 * @example Providing the live layer
 * ```typescript
 * import { SHA256Service, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sha256 = yield* SHA256Service
 *   return yield* sha256.hash(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
 * })
 *
 * const result = await Effect.runPromise(program.pipe(Effect.provide(SHA256Live)))
 * ```
 *
 * @example Merging with other layers
 * ```typescript
 * import { SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Layer from 'effect/Layer'
 *
 * const CryptoLive = Layer.merge(SHA256Live, KeccakLive)
 * ```
 *
 * @see {@link SHA256Service} - The service tag
 * @see {@link SHA256Test} - Test implementation for unit tests
 * @since 0.0.1
 */
export const SHA256Live = Layer.succeed(SHA256Service, {
	hash: (data) => Effect.sync(() => SHA256.hash(data)),
});

/**
 * Test layer for SHA256Service returning deterministic zero-filled hashes.
 *
 * @description
 * Provides a mock SHA-256 implementation that always returns a 32-byte
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
 * import { SHA256Service, SHA256Test } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 * import { describe, it, expect } from 'vitest'
 *
 * describe('MyService', () => {
 *   it('should hash data', async () => {
 *     const program = Effect.gen(function* () {
 *       const sha256 = yield* SHA256Service
 *       return yield* sha256.hash(new Uint8Array([1, 2, 3]))
 *     })
 *
 *     const result = await Effect.runPromise(program.pipe(Effect.provide(SHA256Test)))
 *     expect(result).toEqual(new Uint8Array(32)) // All zeros
 *   })
 * })
 * ```
 *
 * @see {@link SHA256Service} - The service tag
 * @see {@link SHA256Live} - Production implementation
 * @since 0.0.1
 */
export const SHA256Test = Layer.succeed(SHA256Service, {
	hash: (_data) => Effect.sync(() => new Uint8Array(32) as SHA256Hash),
});
