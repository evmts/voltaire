/**
 * @fileoverview Keccak-256 cryptographic hashing module for Effect.
 *
 * @description
 * This module provides the standard Ethereum Keccak-256 hashing algorithm
 * wrapped in Effect for type-safe, composable cryptographic operations.
 *
 * Keccak-256 is used throughout Ethereum for:
 * - Address derivation from public keys
 * - Transaction hashing
 * - State root computation
 * - Message signing (EIP-191, EIP-712)
 * - Smart contract event topic hashing
 *
 * @example Basic hashing
 * ```typescript
 * import { hash, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = hash(new Uint8Array([1, 2, 3])).pipe(
 *   Effect.provide(KeccakLive)
 * )
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @example Using the service directly
 * ```typescript
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const hash1 = yield* keccak.hash(new Uint8Array([1, 2, 3]))
 *   const hash2 = yield* keccak.hash(new Uint8Array([4, 5, 6]))
 *   return [hash1, hash2]
 * }).pipe(Effect.provide(KeccakLive))
 * ```
 *
 * @module Keccak256
 * @since 0.0.1
 */

export { hash } from "./hash.js";
export type { Keccak256Hash } from "@tevm/voltaire";
export {
	KeccakLive,
	KeccakService,
	type KeccakServiceShape,
	KeccakTest,
} from "./KeccakService.js";
