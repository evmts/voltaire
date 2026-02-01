/**
 * @fileoverview SignersService Effect service definition for cryptographic signing.
 * @module
 * @since 0.0.1
 */

import type { CryptoError, InvalidPrivateKeyError } from "./errors.js";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

/**
 * Represents an Ethereum signer capable of signing messages, transactions, and typed data.
 *
 * @since 0.0.1
 */
export interface Signer {
	/** The Ethereum address derived from the signer's public key */
	readonly address: string;
	/** The 64-byte uncompressed public key (without 04 prefix) */
	readonly publicKey: Uint8Array;
	/** Signs a message using EIP-191 personal sign format */
	readonly signMessage: (
		message: string | Uint8Array,
	) => Effect.Effect<string, CryptoError>;
	/** Signs a transaction and returns the signed transaction */
	readonly signTransaction: (
		transaction: unknown,
	) => Effect.Effect<unknown, CryptoError>;
	/** Signs EIP-712 typed data */
	readonly signTypedData: (
		typedData: unknown,
	) => Effect.Effect<string, CryptoError>;
}

/**
 * Shape of the SignersService interface.
 *
 * @since 0.0.1
 */
export interface SignersServiceShape {
	/** Creates a signer from a private key */
	readonly fromPrivateKey: (
		privateKey: string | Uint8Array,
	) => Effect.Effect<Signer, InvalidPrivateKeyError>;

	/** Gets the Ethereum address from a signer */
	readonly getAddress: (signer: Signer) => Effect.Effect<string, never>;

	/** Recovers the sender address from a signed transaction */
	readonly recoverTransactionAddress: (
		transaction: unknown,
	) => Effect.Effect<string, CryptoError>;
}

/**
 * Effect service tag for cryptographic signing operations.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const signers = yield* SignersService
 *   const signer = yield* signers.fromPrivateKey(privateKey)
 *   const address = yield* signers.getAddress(signer)
 *   return address
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SignersService extends Context.Tag("SignersService")<
	SignersService,
	SignersServiceShape
>() {}
