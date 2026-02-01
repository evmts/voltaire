/**
 * @fileoverview Recover Ethereum address from EIP-191 signed message.
 * @module Signature/recoverMessageAddress
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import type { KeccakService } from "../Keccak256/index.js";
import type { Secp256k1Service } from "../Secp256k1/index.js";
import type { AddressDerivationError, RecoverError } from "./errors.js";
import { hashMessage } from "./hashMessage.js";
import { recoverAddress, type SignatureInput } from "./recoverAddress.js";

/**
 * Recovers the signer address from an EIP-191 personal_sign signature.
 *
 * @description
 * Hashes the message using EIP-191 format, then recovers the signer address.
 * This is the inverse of `personal_sign` - given a message and signature,
 * we can determine who signed it.
 *
 * The function:
 * 1. Hashes the message with EIP-191 prefix
 * 2. Recovers the public key using ecrecover
 * 3. Derives the address from the public key
 *
 * @param params - Object containing message and signature
 * @param params.message - The original message (string or bytes)
 * @param params.signature - The signature (65 bytes or {r, s, v/yParity})
 * @returns Effect containing the recovered 20-byte address
 *
 * @example
 * ```typescript
 * import { recoverMessageAddress } from 'voltaire-effect/crypto/Signature'
 * import { CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = recoverMessageAddress({
 *   message: 'Hello, Ethereum!',
 *   signature: sig
 * }).pipe(Effect.provide(CryptoLive))
 *
 * const address = await Effect.runPromise(program)
 * ```
 *
 * @throws {RecoverError} When public key recovery fails
 * @throws {AddressDerivationError} When address derivation fails
 * @since 0.0.1
 */
export const recoverMessageAddress = (params: {
	message: string | Uint8Array;
	signature: SignatureInput;
}): Effect.Effect<
	AddressType,
	RecoverError | AddressDerivationError,
	KeccakService | Secp256k1Service
> =>
	Effect.gen(function* () {
		// Hash message with EIP-191 prefix
		const hash = yield* hashMessage(params.message);

		// Recover address from hash and signature
		// Cast Keccak256Hash to HashType (both are 32-byte hashes)
		return yield* recoverAddress({
			hash: hash as unknown as HashType,
			signature: params.signature,
		});
	});
