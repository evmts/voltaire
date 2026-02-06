/**
 * @fileoverview ENS error type for ENS resolution failures.
 * @module Provider/ens/EnsError
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Error thrown when an ENS operation fails.
 *
 * @description
 * Contains details about the failed ENS operation including
 * the name being resolved and the underlying cause.
 *
 * @since 0.0.1
 */
export class EnsError extends Data.TaggedError("EnsError")<{
	/** The ENS name or address that caused the error */
	readonly input: unknown;

	/** Human-readable error message */
	readonly message: string;

	/** Optional underlying cause */
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new EnsError.
	 *
	 * @param input - The ENS name or address that caused the error
	 * @param message - Human-readable error message
	 * @param cause - Optional underlying error
	 */
	constructor(input: unknown, message: string, cause?: unknown) {
		super({ input, message, cause });
	}
}
