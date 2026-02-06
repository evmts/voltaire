/**
 * @fileoverview Secp256k1 public key recovery function for Effect-based applications.
 * Provides a functional Effect wrapper around secp256k1 ECDSA public key recovery.
 *
 * @module Secp256k1/recover
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
	InvalidRecoveryIdError,
	InvalidSignatureError,
	Secp256k1Error,
} from "./errors.js";
import { mapToSecp256k1Error } from "./errors.js";

/**
 * Recovers the public key from a secp256k1 signature and message hash.
 *
 * @description
 * Uses the recovery ID (v value) embedded in the 65-byte signature to
 * mathematically recover the original signer's public key. This is the
 * inverse operation of signing and is essential for Ethereum's ecrecover.
 *
 * The recovered public key is the 65-byte uncompressed format:
 * - Prefix byte (0x04)
 * - X coordinate (32 bytes)
 * - Y coordinate (32 bytes)
 *
 * This function is used internally by ecrecover and is useful for:
 * - Verifying transaction signatures
 * - Recovering signer addresses from signed messages
 * - Implementing EIP-191 and EIP-712 verification
 *
 * @param {Secp256k1SignatureType} signature - The 65-byte recoverable signature
 *   containing r (32 bytes), s (32 bytes), and v (1 byte recovery ID).
 * @param {HashType} messageHash - The 32-byte message hash that was signed.
 *
 * @returns {Effect.Effect<Secp256k1PublicKeyType, InvalidSignatureError | InvalidRecoveryIdError | Secp256k1Error>}
 *   An Effect that:
 *   - Succeeds with a 65-byte uncompressed public key (branded Uint8Array)
 *   - Fails with InvalidSignatureError if recovery fails
 *   - Fails with InvalidRecoveryIdError if the recovery ID is invalid
 *   - Fails with Secp256k1Error for other cryptographic failures
 *
 * @throws {InvalidSignatureError} When the signature is malformed.
 * @throws {InvalidRecoveryIdError} When the recovery ID is invalid.
 * @throws {Secp256k1Error} When recovery fails for cryptographic reasons.
 *
 * @example Basic recovery
 * ```typescript
 * import { recover } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const publicKey = await Effect.runPromise(recover(signature, messageHash))
 * console.log(publicKey.length) // 65 (uncompressed)
 * ```
 *
 * @example Deriving an Ethereum address from recovered key
 * ```typescript
 * import { recover } from 'voltaire-effect/crypto/Secp256k1'
 * import { hash as keccak } from 'voltaire-effect/crypto/Keccak256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const pubKey = yield* recover(signature, messageHash)
 *   // Remove 0x04 prefix, hash, take last 20 bytes
 *   const pubKeyHash = yield* keccak(pubKey.slice(1))
 *   return pubKeyHash.slice(-20) // The address
 * })
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { recover } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = recover(signature, messageHash).pipe(
 *   Effect.catchTag('InvalidSignatureError', (e) =>
 *     Effect.fail(new Error(`Invalid signature: ${e.message}`))
 *   )
 * )
 * ```
 *
 * @see {@link sign} - Sign a message hash
 * @see {@link verify} - Verify signature without recovery
 * @see {@link Secp256k1Service} - Service interface for dependency injection
 * @since 0.0.1
 */
export const recover = (
	signature: Secp256k1SignatureType,
	messageHash: HashType,
): Effect.Effect<
	Secp256k1PublicKeyType,
	InvalidSignatureError | InvalidRecoveryIdError | Secp256k1Error
> =>
	Effect.try({
		try: () => Secp256k1.recoverPublicKey(signature, messageHash),
		catch: (e) => mapToSecp256k1Error(e, "recover"),
	});
