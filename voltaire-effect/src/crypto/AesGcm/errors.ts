/**
 * @fileoverview Error types for AES-GCM encryption operations.
 * @module AesGcm/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Invalid key size for AES-GCM encryption.
 * Key must be 16 bytes (128-bit), 24 bytes (192-bit), or 32 bytes (256-bit).
 *
 * @since 0.0.1
 */
export class InvalidKeyError extends Data.TaggedError("InvalidKeyError")<{
	readonly message: string;
	readonly keyLength: number;
	readonly expectedLengths: readonly number[];
}> {}

/**
 * Invalid nonce size for AES-GCM encryption.
 * Nonce must be 12 bytes (96-bit).
 *
 * @since 0.0.1
 */
export class InvalidNonceError extends Data.TaggedError("InvalidNonceError")<{
	readonly message: string;
	readonly nonceLength: number;
	readonly expectedLength: number;
}> {}

/**
 * Union of all AES-GCM error types.
 *
 * @since 0.0.1
 */
export type AesGcmError = InvalidKeyError | InvalidNonceError;
