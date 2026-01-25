/**
 * @fileoverview RIPEMD-160 cryptographic hashing module for Effect.
 *
 * @description
 * Provides RIPEMD-160 hashing producing 160-bit (20-byte) output.
 * Primarily used in Bitcoin address generation when combined with SHA-256
 * to create the HASH160 function.
 *
 * Key features:
 * - Fixed 20-byte output
 * - Used in Bitcoin HASH160 = RIPEMD160(SHA256(data))
 * - Compact addresses with adequate collision resistance
 *
 * @example
 * ```typescript
 * import { hash, Ripemd160Live } from 'voltaire-effect/crypto/Ripemd160'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(Ripemd160Live)
 * )
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module Ripemd160
 * @since 0.0.1
 */
export { Ripemd160Service, Ripemd160Live, Ripemd160Test } from './Ripemd160Service.js'
export { hash } from './hash.js'
