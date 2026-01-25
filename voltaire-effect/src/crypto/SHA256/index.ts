/**
 * @fileoverview SHA-256 cryptographic hashing module for Effect.
 *
 * @description
 * This module provides the SHA-256 hashing algorithm wrapped in Effect
 * for type-safe, composable cryptographic operations.
 *
 * SHA-256 is the standard hash function used in:
 * - Bitcoin block headers and transactions
 * - Ethereum precompile (address 0x02)
 * - TLS/SSL certificates
 * - Many cryptographic protocols and standards
 *
 * SHA-256 produces a 32-byte (256-bit) hash that is:
 * - Collision-resistant (computationally infeasible to find two inputs with same hash)
 * - Pre-image resistant (one-way function)
 * - Second pre-image resistant
 *
 * @example Basic hashing
 * ```typescript
 * import { hash, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(SHA256Live)
 * )
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @example Using the service directly
 * ```typescript
 * import { SHA256Service, SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sha256 = yield* SHA256Service
 *   const hash1 = yield* sha256.hash(new Uint8Array([1, 2, 3]))
 *   const hash2 = yield* sha256.hash(new Uint8Array([4, 5, 6]))
 *   return [hash1, hash2]
 * }).pipe(Effect.provide(SHA256Live))
 * ```
 *
 * @module SHA256
 * @since 0.0.1
 */
export { SHA256Service, SHA256Live, SHA256Test } from './SHA256Service.js'
export { hash } from './hash.js'
