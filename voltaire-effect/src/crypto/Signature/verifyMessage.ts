/**
 * @fileoverview Verify EIP-191 personal_sign signature.
 * @module Signature/verifyMessage
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as Effect from "effect/Effect";
import { KeccakService } from "../Keccak256/index.js";
import { Secp256k1Service } from "../Secp256k1/index.js";
import { constantTimeEqual } from "./constantTimeEqual.js";
import { VerifyError } from "./errors.js";
import { recoverMessageAddress } from "./recoverMessageAddress.js";
import type { SignatureInput } from "./recoverAddress.js";

/**
 * Verifies an EIP-191 personal_sign signature.
 *
 * @description
 * Recovers the signer address from the message and signature, then
 * compares it to the expected address using constant-time comparison.
 *
 * Returns true if the signature was created by the expected address.
 *
 * @param params - Object containing message, signature, and expected address
 * @param params.message - The original message (string or bytes)
 * @param params.signature - The signature (65 bytes or {r, s, v/yParity})
 * @param params.address - The expected signer address (20 bytes)
 * @returns Effect containing true if signature is valid
 *
 * @example
 * ```typescript
 * import { verifyMessage } from 'voltaire-effect/crypto/Signature'
 * import { CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = verifyMessage({
 *   message: 'Hello, Ethereum!',
 *   signature: sig,
 *   address: expectedAddress
 * }).pipe(Effect.provide(CryptoLive))
 *
 * const isValid = await Effect.runPromise(program)
 * ```
 *
 * @throws {VerifyError} When signature verification fails
 * @since 0.0.1
 */
export const verifyMessage = (params: {
	message: string | Uint8Array;
	signature: SignatureInput;
	address: AddressType;
}): Effect.Effect<boolean, VerifyError, KeccakService | Secp256k1Service> =>
	Effect.gen(function* () {
		// Recover address from message and signature
		const recoveredAddress = yield* recoverMessageAddress({
			message: params.message,
			signature: params.signature,
		}).pipe(
			Effect.mapError(
				(e) =>
					new VerifyError({
						message: `Signature verification failed: ${e.message}`,
						cause: e,
					}),
			),
		);

		// Compare addresses using constant-time comparison to prevent timing attacks
		return constantTimeEqual(recoveredAddress, params.address);
	});
