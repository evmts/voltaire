/**
 * @fileoverview Error types for signature verification operations.
 * @module Signature/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Error when signature verification fails.
 *
 * @description
 * Thrown when signature verification encounters an error during processing.
 * This includes malformed signatures, invalid public keys, or cryptographic failures.
 *
 * @since 0.0.1
 */
export class VerifyError extends Data.TaggedError("VerifyError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new VerifyError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(message: string, options?: { cause?: unknown }): VerifyError {
		return new VerifyError({ message, cause: options?.cause });
	}
}

/**
 * Error when signature recovery fails.
 *
 * @description
 * Thrown when public key recovery from signature fails.
 * This can happen with malformed signatures or invalid recovery IDs.
 *
 * @since 0.0.1
 */
export class RecoverError extends Data.TaggedError("RecoverError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new RecoverError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(message: string, options?: { cause?: unknown }): RecoverError {
		return new RecoverError({ message, cause: options?.cause });
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
 * Union type of all signature verification errors.
 *
 * @since 0.0.1
 */
export type SignatureError = VerifyError | RecoverError | AddressDerivationError;
