/**
 * @fileoverview Blake2 cryptographic hashing module for Effect.
 *
 * @description
 * Provides high-performance Blake2b hashing with configurable output length.
 * Blake2 is faster than SHA-256 while providing equivalent security, making
 * it ideal for blockchain and cryptographic applications.
 *
 * Key features:
 * - Variable output length (1-64 bytes)
 * - Faster than SHA-256
 * - Used in Zcash, Argon2, and other protocols
 *
 * @example
 * ```typescript
 * import { hash, Blake2Live } from 'voltaire-effect/crypto/Blake2'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3]), 32).pipe(
 *   Effect.provide(Blake2Live)
 * )
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module Blake2
 * @since 0.0.1
 */
export { Blake2Service, Blake2Live, Blake2Test } from './Blake2Service.js'
export { hash } from './hash.js'
