/**
 * @fileoverview Test implementation of X25519Service.
 * @module X25519/X25519Test
 * @since 0.0.1
 */
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { X25519Service } from "./X25519Service.js";

/**
 * Test layer for X25519Service returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns zero-filled
 * arrays for keys and shared secrets.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { X25519Service, X25519Test, generateKeyPair } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = generateKeyPair().pipe(Effect.provide(X25519Test))
 * // Returns { secretKey: Uint8Array(32), publicKey: Uint8Array(32) }
 * ```
 *
 * @since 0.0.1
 */
export const X25519Test = Layer.succeed(X25519Service, {
	generateKeyPair: () =>
		Effect.succeed({
			secretKey: new Uint8Array(32),
			publicKey: new Uint8Array(32),
		}),
	getPublicKey: (_secretKey: Uint8Array) => Effect.succeed(new Uint8Array(32)),
	computeSecret: (_secretKey: Uint8Array, _publicKey: Uint8Array) =>
		Effect.succeed(new Uint8Array(32)),
});
