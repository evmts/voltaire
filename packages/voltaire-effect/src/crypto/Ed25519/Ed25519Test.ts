/**
 * @fileoverview Test layer for Ed25519Service with deterministic mock values.
 * @module Ed25519Test
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Ed25519Service } from "./Ed25519Service.js";

/**
 * Test layer for Ed25519Service returning deterministic mock values.
 *
 * @description
 * Provides a mock implementation for unit testing that returns predictable
 * values without performing actual cryptographic operations. Use this layer
 * to test code that depends on Ed25519Service without cryptographic overhead.
 *
 * Mock behaviors:
 * - `sign`: Returns a zero-filled 64-byte signature
 * - `verify`: Always returns true
 * - `getPublicKey`: Returns a zero-filled 32-byte public key
 *
 * @example
 * ```typescript
 * import { Ed25519Service, Ed25519Test } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const ed = yield* Ed25519Service
 *
 *   // Always returns true in test mode
 *   const isValid = yield* ed.verify(signature, message, publicKey)
 *
 *   // Returns zero-filled 64-byte array
 *   const sig = yield* ed.sign(message, secretKey)
 *
 *   return { isValid, sig }
 * }).pipe(Effect.provide(Ed25519Test))
 *
 * const result = await Effect.runPromise(testProgram)
 * console.log(result.isValid) // true
 * console.log(result.sig.length) // 64
 * ```
 *
 * @see {@link Ed25519Service} - The service definition
 * @see {@link Ed25519Live} - Production implementation
 * @since 0.0.1
 */
export const Ed25519Test = Layer.succeed(Ed25519Service, {
	sign: (_message: Uint8Array, _secretKey: Uint8Array) =>
		Effect.succeed(new Uint8Array(64)),
	verify: (
		_signature: Uint8Array,
		_message: Uint8Array,
		_publicKey: Uint8Array,
	) => Effect.succeed(true),
	getPublicKey: (_secretKey: Uint8Array) => Effect.succeed(new Uint8Array(32)),
});
