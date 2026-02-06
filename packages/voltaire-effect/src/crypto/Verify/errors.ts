/**
 * @fileoverview Error types for signature verification operations.
 * @module Verify/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Error when signature recovery fails.
 *
 * @description
 * Thrown when the signature cannot be recovered to a valid public key.
 * This can happen with malformed signatures or invalid recovery IDs.
 *
 * @since 0.0.1
 */
export class SignatureRecoveryError extends Data.TaggedError(
	"SignatureRecoveryError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new SignatureRecoveryError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(
		message: string,
		options?: { cause?: unknown },
	): SignatureRecoveryError {
		return new SignatureRecoveryError({ message, cause: options?.cause });
	}
}

/**
 * Error when address derivation from public key fails.
 *
 * @description
 * Thrown when the recovered public key cannot be converted to an address.
 *
 * @since 0.0.1
 */
export class AddressDerivationError extends Data.TaggedError(
	"AddressDerivationError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new AddressDerivationError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(
		message: string,
		options?: { cause?: unknown },
	): AddressDerivationError {
		return new AddressDerivationError({ message, cause: options?.cause });
	}
}

/**
 * Error when message hashing fails.
 *
 * @description
 * Thrown when EIP-191 message hashing encounters an error.
 *
 * @since 0.0.1
 */
export class MessageHashError extends Data.TaggedError("MessageHashError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new MessageHashError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(message: string, options?: { cause?: unknown }): MessageHashError {
		return new MessageHashError({ message, cause: options?.cause });
	}
}

/**
 * Union type of all verification errors.
 *
 * @since 0.0.1
 */
export type VerifyError =
	| SignatureRecoveryError
	| AddressDerivationError
	| MessageHashError;
