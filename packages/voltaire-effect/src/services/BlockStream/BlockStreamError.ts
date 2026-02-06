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
}> {
	constructor(
		message: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
		},
	) {
		super({
			message,
			cause: options?.cause,
			context: options?.context,
		});
	}
}
