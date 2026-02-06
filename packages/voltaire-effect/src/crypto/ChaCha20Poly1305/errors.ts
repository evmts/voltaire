/**
 * @fileoverview Error types for ChaCha20-Poly1305 encryption operations.
 * @module ChaCha20Poly1305/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Invalid key size for ChaCha20-Poly1305 encryption.
 * Key must be 32 bytes (256-bit).
 *
 * @since 0.0.1
 */
export class InvalidKeyError extends Data.TaggedError("InvalidKeyError")<{
	readonly message: string;
	readonly keyLength: number;
	readonly expectedLength: number;
}> {}

/**
 * Invalid nonce size for ChaCha20-Poly1305 encryption.
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
 * Union of all ChaCha20-Poly1305 error types.
 *
 * @since 0.0.1
 */
export type ChaCha20Poly1305Error = InvalidKeyError | InvalidNonceError;
