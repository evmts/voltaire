/**
 * @fileoverview Verify EIP-712 typed data signature.
 * @module Signature/verifyTypedData
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { TypedData } from "@tevm/voltaire/EIP712";
import * as Effect from "effect/Effect";
import { EIP712Service } from "../EIP712/index.js";
import type { KeccakService } from "../Keccak256/index.js";
import type { Secp256k1Service } from "../Secp256k1/index.js";
import { constantTimeEqual } from "./constantTimeEqual.js";
import { VerifyError } from "./errors.js";
import { recoverAddress, type SignatureInput } from "./recoverAddress.js";

/**
 * Verifies an EIP-712 typed data signature.
 *
 * @description
 * Hashes the typed data using EIP-712 format, recovers the signer address,
 * and compares it to the expected address using constant-time comparison.
 *
 * Returns true if the signature was created by the expected address.
 *
 * @param params - Object containing typedData, signature, and expected address
 * @param params.typedData - The EIP-712 typed data that was signed
 * @param params.signature - The signature (65 bytes or {r, s, v/yParity})
 * @param params.address - The expected signer address (20 bytes)
 * @returns Effect containing true if signature is valid
 *
 * @example
 * ```typescript
 * import { verifyTypedData } from 'voltaire-effect/crypto/Signature'
 * import { CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const typedData = {
 *   domain: { name: 'MyDApp', version: '1', chainId: 1 },
 *   types: { Person: [{ name: 'name', type: 'string' }] },
 *   primaryType: 'Person',
 *   message: { name: 'Alice' }
 * }
 *
 * const program = verifyTypedData({
 *   typedData,
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
export const verifyTypedData = (params: {
	typedData: TypedData;
	signature: SignatureInput;
	address: AddressType;
}): Effect.Effect<
	boolean,
	VerifyError,
	KeccakService | Secp256k1Service | EIP712Service
> =>
	Effect.gen(function* () {
		const eip712 = yield* EIP712Service;

		// Hash the typed data
		const hash = yield* eip712.hashTypedData(params.typedData);

		// Recover address from hash and signature
		const recoveredAddress = yield* recoverAddress({
			hash,
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
