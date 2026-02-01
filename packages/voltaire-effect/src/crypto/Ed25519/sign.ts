/**
 * @fileoverview Ed25519 message signing function for Effect-based applications.
 * @module Ed25519/sign
 * @since 0.0.1
 */

import type {
	Ed25519Error,
	InvalidSecretKeyError,
} from "@tevm/voltaire/Ed25519";
import * as Ed25519 from "@tevm/voltaire/Ed25519";
import * as Effect from "effect/Effect";

/**
 * Signs a message using the Ed25519 signature scheme.
 *
 * @description
 * Creates a 64-byte EdDSA signature using the Ed25519 curve. Ed25519 provides
 * high-speed, high-security signatures with several advantages:
 *
 * - Deterministic: Same message + key always produces same signature
 * - Fast: Significantly faster than RSA and ECDSA
 * - Compact: 64-byte signatures, 32-byte keys
 * - Side-channel resistant: Designed to resist timing attacks
 *
 * The signature can be verified using the corresponding public key and the
 * original message.
 *
 * @param message - The message bytes to sign (any length)
 * @param secretKey - The 32-byte secret key
 * @returns Effect containing the 64-byte Ed25519 signature
 *
 * @example
 * ```typescript
 * import { sign, verify, getPublicKey } from 'voltaire-effect/crypto/Ed25519'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign a message
 * const message = new TextEncoder().encode('Hello, Ed25519!')
 * const signature = await Effect.runPromise(sign(message, secretKey))
 * console.log(signature.length) // 64
 *
 * // Complete signing workflow
 * const program = Effect.gen(function* () {
 *   const publicKey = yield* getPublicKey(secretKey)
 *   const sig = yield* sign(message, secretKey)
 *   const isValid = yield* verify(sig, message, publicKey)
 *   return { sig, isValid }
 * })
 * ```
 *
 * @throws InvalidSecretKeyError - When the secret key is not exactly 32 bytes
 * @throws Ed25519Error - When the signing operation fails
 * @see {@link verify} - Verify the generated signature
 * @see {@link getPublicKey} - Derive the public key from secret key
 * @see {@link Ed25519Service} - Full service interface
 * @since 0.0.1
 */
export const sign = (
	message: Uint8Array,
	secretKey: Uint8Array,
): Effect.Effect<Uint8Array, InvalidSecretKeyError | Ed25519Error> =>
	Effect.try({
		try: () => Ed25519.sign(message, secretKey as any),
		catch: (e) => e as InvalidSecretKeyError | Ed25519Error,
	});
