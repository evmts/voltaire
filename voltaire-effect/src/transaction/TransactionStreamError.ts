/**
 * @fileoverview TransactionStream error type for voltaire-effect.
 *
 * @module TransactionStreamError
 * @since 0.2.13
 */

import * as Data from "effect/Data";

/**
 * Error thrown when a TransactionStream operation fails.
 *
 * @since 0.2.13
 */
export class TransactionStreamError extends Data.TaggedError("TransactionStreamError")<{
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {}
