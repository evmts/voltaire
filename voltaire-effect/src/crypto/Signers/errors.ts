/**
 * @fileoverview Error types for Signers module using Effect TaggedError.
 * @module Signers/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * General cryptographic error during signing operations.
 *
 * @since 0.0.1
 */
export class CryptoError extends Data.TaggedError("CryptoError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Invalid private key format or value.
 *
 * @since 0.0.1
 */
export class InvalidPrivateKeyError extends Data.TaggedError(
	"InvalidPrivateKeyError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {}
