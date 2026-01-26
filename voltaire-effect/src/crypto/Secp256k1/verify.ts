/**
 * @fileoverview Secp256k1 signature verification function for Effect-based applications.
 * Provides a functional Effect wrapper around secp256k1 ECDSA signature verification.
 *
 * @module Secp256k1/verify
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import type {
	Secp256k1PublicKeyType,
	Secp256k1SignatureType,
} from "@tevm/voltaire/Secp256k1";
import * as Secp256k1 from "@tevm/voltaire/Secp256k1";
import * as Effect from "effect/Effect";
import type {
	InvalidPublicKeyError,
	InvalidSignatureError,
	Secp256k1Error,
} from "./errors.js";
import { mapToSecp256k1Error } from "./errors.js";

/**
 * Verifies a secp256k1 signature against a message hash and public key.
 *
 * @description
 * Performs ECDSA signature verification on the secp256k1 curve. Returns true
 * if the signature was created by the private key corresponding to the given
 * public key, for the given message hash.
 *
 * This is a direct verification that requires the public key. For scenarios
 * where you only have the signature and message, use {@link recover} to first
 * recover the public key, then compare with the expected signer.
 *
 * The verification is performed in constant time to prevent timing attacks.
 *
 * @param {Secp256k1SignatureType} signature - The 65-byte recoverable signature
 *   containing r (32 bytes), s (32 bytes), and v (1 byte recovery ID).
 * @param {HashType} messageHash - The 32-byte message hash that was signed.
 * @param {Secp256k1PublicKeyType} publicKey - The 65-byte uncompressed public key
 *   of the expected signer.
 *
 * @returns {Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError | Secp256k1Error>}
 *   An Effect that:
 *   - Succeeds with `true` if the signature is valid
 *   - Succeeds with `false` if the signature is invalid but well-formed
 *   - Fails with InvalidSignatureError if the signature is malformed
 *   - Fails with InvalidPublicKeyError if the public key is invalid
 *   - Fails with Secp256k1Error for other cryptographic failures
 *
 * @throws {InvalidSignatureError} When the signature format is invalid.
 * @throws {InvalidPublicKeyError} When the public key format is invalid.
 * @throws {Secp256k1Error} When verification fails for cryptographic reasons.
 *
 * @example Basic verification
 * ```typescript
 * import { verify } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = await Effect.runPromise(verify(signature, messageHash, publicKey))
 * if (isValid) {
 *   console.log('Signature is valid!')
 * }
 * ```
 *
 * @example Full sign-verify roundtrip
 * ```typescript
 * import { sign, verify } from 'voltaire-effect/crypto/Secp256k1'
 * import { getPublicKey } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signature = yield* sign(messageHash, privateKey)
 *   const publicKey = getPublicKey(privateKey)
 *   return yield* verify(signature, messageHash, publicKey)
 * })
 *
 * const isValid = await Effect.runPromise(program) // true
 * ```
 *
 * @example Conditional logic based on verification
 * ```typescript
 * import { verify } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const isValid = yield* verify(signature, messageHash, expectedPubKey)
 *   if (!isValid) {
 *     return yield* Effect.fail(new Error('Unauthorized'))
 *   }
 *   return yield* processAuthorizedRequest()
 * })
 * ```
 *
 * @see {@link sign} - Sign a message hash
 * @see {@link recover} - Recover public key from signature
 * @see {@link Secp256k1Service} - Service interface for dependency injection
 * @since 0.0.1
 */
export const verify = (
	signature: Secp256k1SignatureType,
	messageHash: HashType,
	publicKey: Secp256k1PublicKeyType,
): Effect.Effect<
	boolean,
	InvalidSignatureError | InvalidPublicKeyError | Secp256k1Error
> =>
	Effect.try({
		try: () => Secp256k1.verify(signature, messageHash, publicKey),
		catch: (e) => mapToSecp256k1Error(e, "verify"),
	});
