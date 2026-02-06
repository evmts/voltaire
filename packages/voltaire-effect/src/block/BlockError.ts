/**
 * @fileoverview Block module error types for voltaire-effect.
 *
 * @module BlockError
 * @since 0.3.0
 */

import * as Data from "effect/Data";

/**
 * Error thrown when a block operation fails.
 *
 * @since 0.3.0
 */
export class BlockError extends Data.TaggedError("BlockError")<{
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

/**
 * Error thrown when a block is not found.
 *
 * @since 0.3.0
 */
export class BlockNotFoundError extends Data.TaggedError("BlockNotFoundError")<{
	readonly identifier: string | bigint;
	readonly message: string;
	readonly cause?: unknown;
}> {
	constructor(identifier: string | bigint, options?: { cause?: unknown }) {
		super({
			identifier,
			message: `Block ${typeof identifier === "bigint" ? identifier.toString() : identifier} not found`,
			cause: options?.cause,
		});
	}
}
