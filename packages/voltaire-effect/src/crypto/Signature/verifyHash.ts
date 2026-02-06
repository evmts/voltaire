/**
 * @fileoverview Verify signature against a raw hash.
 * @module Signature/verifyHash
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import type { KeccakService } from "../Keccak256/index.js";
import type { Secp256k1Service } from "../Secp256k1/index.js";
import { constantTimeEqual } from "./constantTimeEqual.js";
import { VerifyError } from "./errors.js";
import { recoverAddress, type SignatureInput } from "./recoverAddress.js";

/**
 * Verifies a signature against a raw message hash.
 *
 * @description
 * Recovers the signer address from the hash and signature, then
 * compares it to the expected address using constant-time comparison.
 *
 * Use this when you already have the message hash (e.g., from EIP-712
 * or custom hashing). For EIP-191 personal_sign, use `verifyMessage` instead.
 *
 * @param params - Object containing hash, signature, and expected address
 * @param params.hash - The 32-byte message hash that was signed
 * @param params.signature - The signature (65 bytes or {r, s, v/yParity})
 * @param params.address - The expected signer address (20 bytes)
 * @returns Effect containing true if signature is valid
 *
 * @example
 * ```typescript
 * import { verifyHash } from 'voltaire-effect/crypto/Signature'
 * import { CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = verifyHash({
 *   hash: messageHash,
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
export const verifyHash = (params: {
	hash: HashType;
	signature: SignatureInput;
	address: AddressType;
}): Effect.Effect<boolean, VerifyError, KeccakService | Secp256k1Service> =>
	Effect.gen(function* () {
		// Recover address from hash and signature
		const recoveredAddress = yield* recoverAddress({
			hash: params.hash,
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
