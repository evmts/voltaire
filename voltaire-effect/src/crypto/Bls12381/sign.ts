/**
 * @fileoverview BLS12-381 message signing function for Effect-based applications.
 * @module Bls12381/sign
 * @since 0.0.1
 */

import type {
	InvalidScalarError,
	SignatureError,
} from "@tevm/voltaire/Bls12381";
import * as Bls12381 from "@tevm/voltaire/Bls12381";
import * as Effect from "effect/Effect";

/**
 * Signs a message using the BLS12-381 signature scheme.
 *
 * @description
 * Creates a 96-byte BLS signature on the BLS12-381 pairing-friendly curve.
 * BLS signatures have a unique property - they can be aggregated, meaning
 * multiple signatures can be combined into a single compact signature.
 *
 * This makes BLS ideal for:
 * - Ethereum 2.0 consensus layer (validators sign attestations)
 * - Multi-signature schemes
 * - Threshold signatures
 * - Any protocol requiring many signatures
 *
 * @param message - The message bytes to sign (any length, hashed internally)
 * @param privateKey - The 32-byte private key scalar
 * @returns Effect containing the 96-byte BLS signature (G2 point)
 *
 * @example
 * ```typescript
 * import { sign, verify, aggregate } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * // Sign a message
 * const message = new TextEncoder().encode('Hello, BLS!')
 * const signature = await Effect.runPromise(sign(message, privateKey))
 * console.log(signature.length) // 96
 *
 * // Sign and aggregate multiple signatures
 * const program = Effect.gen(function* () {
 *   const sig1 = yield* sign(message1, privateKey1)
 *   const sig2 = yield* sign(message2, privateKey2)
 *   const aggregated = yield* aggregate([sig1, sig2])
 *   return aggregated
 * })
 * ```
 *
 * @throws InvalidScalarError - When the private key is not a valid scalar
 * @throws SignatureError - When the signing operation fails
 * @see {@link verify} - Verify the generated signature
 * @see {@link aggregate} - Aggregate multiple signatures
 * @see {@link Bls12381Service} - Full service interface
 * @since 0.0.1
 */
export const sign = (
	message: Uint8Array,
	privateKey: Uint8Array,
): Effect.Effect<Uint8Array, InvalidScalarError | SignatureError> =>
	Effect.try({
		try: () => Bls12381.sign(message, privateKey),
		catch: (e) => e as InvalidScalarError | SignatureError,
	});
