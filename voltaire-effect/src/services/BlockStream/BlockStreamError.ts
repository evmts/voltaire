/**
 * @fileoverview BlockStream error type for voltaire-effect.
 *
 * @module BlockStreamError
 * @since 0.2.12
 */

import * as Data from "effect/Data";

/**
 * Error thrown when a BlockStream operation fails.
 *
 * @since 0.2.12
 */
export class BlockStreamError extends Data.TaggedError("BlockStreamError")<{
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {}
