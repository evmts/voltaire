/**
 * @fileoverview Recover Ethereum address from signature and hash.
 * @module Signature/recoverAddress
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import type { SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";
import { KeccakService } from "../Keccak256/index.js";
import { Secp256k1Service } from "../Secp256k1/index.js";
import { AddressDerivationError, RecoverError } from "./errors.js";

/**
 * Signature input format for recovery operations.
 *
 * @description
 * Supports multiple signature formats:
 * - Raw 65-byte signature (SignatureType)
 * - Object with r, s, v components
 * - Object with r, s, yParity components
 *
 * @since 0.0.1
 */
export type SignatureInput =
	| SignatureType
	| {
			readonly r: Uint8Array;
			readonly s: Uint8Array;
			readonly v?: number;
			readonly yParity?: number;
	  };

/**
 * Normalizes signature input to the format expected by Secp256k1.
 *
 * @internal
 */
const normalizeSignature = (
	signature: SignatureInput,
): { r: Uint8Array; s: Uint8Array; v: number } => {
	// If it's a Uint8Array (65 bytes), extract r, s, v
	if (signature instanceof Uint8Array) {
		if (signature.length !== 65) {
			throw new Error(`Expected 65-byte signature, got ${signature.length}`);
		}
		const r = signature.slice(0, 32);
		const s = signature.slice(32, 64);
		const vByte = signature[64];
		// Normalize v: 0/1 -> 27/28
		const v = vByte !== undefined && vByte < 27 ? vByte + 27 : vByte ?? 27;
		return { r, s, v };
	}

	// Object format
	const { r, s } = signature;
	let v: number;

	if (signature.v !== undefined) {
		v = signature.v < 27 ? signature.v + 27 : signature.v;
	} else if (signature.yParity !== undefined) {
		v = signature.yParity + 27;
	} else {
		throw new Error("Signature must have either v or yParity");
	}

	return { r, s, v };
};

/**
 * Recovers the signer address from a signature and message hash.
 *
 * @description
 * Uses secp256k1 ecrecover to derive the Ethereum address that created
 * the signature. This is the core primitive for signature verification.
 *
 * The function:
 * 1. Normalizes the signature to r, s, v format
 * 2. Recovers the public key using ecrecover
 * 3. Derives the address from the public key using keccak256
 *
 * @param params - Object containing hash and signature
 * @param params.hash - The 32-byte message hash that was signed
 * @param params.signature - The signature (65 bytes or {r, s, v/yParity})
 * @returns Effect containing the recovered 20-byte address
 *
 * @example
 * ```typescript
 * import { recoverAddress } from 'voltaire-effect/crypto/Signature'
 * import { CryptoLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = recoverAddress({
 *   hash: messageHash,
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
export const recoverAddress = (params: {
	hash: HashType;
	signature: SignatureInput;
}): Effect.Effect<
	AddressType,
	RecoverError | AddressDerivationError,
	KeccakService | Secp256k1Service
> =>
	Effect.gen(function* () {
		const keccak = yield* KeccakService;
		const secp256k1 = yield* Secp256k1Service;

		// Normalize signature
		const normalizedSig = yield* Effect.try({
			try: () => normalizeSignature(params.signature),
			catch: (e) =>
				RecoverError.of(`Invalid signature format: ${e}`, {
					cause: e,
				}),
		});

		// Create 65-byte signature for secp256k1 service
		const sig65 = new Uint8Array(65);
		sig65.set(normalizedSig.r, 0);
		sig65.set(normalizedSig.s, 32);
		sig65[64] = normalizedSig.v < 27 ? normalizedSig.v : normalizedSig.v - 27;

		// Recover public key
		const publicKey = yield* secp256k1
			.recover(
				sig65 as Parameters<typeof secp256k1.recover>[0],
				params.hash as Parameters<typeof secp256k1.recover>[1],
			)
			.pipe(
				Effect.mapError(
					(e) =>
						new RecoverError({
							message: `Public key recovery failed: ${e}`,
							cause: e,
						}),
				),
			);

		// Derive address from public key
		// Public key is 65 bytes with 0x04 prefix, or 64 bytes without
		const pubKeyBytes =
			publicKey.length === 65 ? publicKey.slice(1) : publicKey;

		const addressHash = yield* keccak.hash(pubKeyBytes).pipe(
			Effect.mapError(
				(e) =>
					new AddressDerivationError({
						message: `Address hash failed: ${e}`,
						cause: e,
					}),
			),
		);

		// Last 20 bytes of hash is the address
		return addressHash.slice(12) as unknown as AddressType;
	});
