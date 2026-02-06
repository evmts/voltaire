/**
 * @fileoverview Unit parsing/formatting error types.
 * @module utils/Unit/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Error thrown when unit parsing or formatting fails.
 */
export class UnitError extends Data.TaggedError("UnitError")<{
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}
