/**
 * @fileoverview Production implementation of X25519Service.
 * @module X25519/X25519Live
 * @since 0.0.1
 */
import * as Layer from "effect/Layer";
import { computeSecret } from "./computeSecret.js";
import { generateKeyPair } from "./generateKeyPair.js";
import { getPublicKey } from "./getPublicKey.js";
import { X25519Service } from "./X25519Service.js";

/**
 * Production layer for X25519Service using native X25519 implementation.
 *
 * @description
 * Provides real X25519 operations using constant-time Curve25519 implementation.
 * Uses cryptographically secure random number generation for key generation.
 *
 * @example
 * ```typescript
 * import { X25519Service, X25519Live } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const x = yield* X25519Service
 *   return yield* x.generateKeyPair()
 * }).pipe(Effect.provide(X25519Live))
 * ```
 *
 * @since 0.0.1
 * @see {@link X25519Test} for unit testing
 */
export const X25519Live = Layer.succeed(X25519Service, {
	generateKeyPair,
	getPublicKey,
	computeSecret,
});
