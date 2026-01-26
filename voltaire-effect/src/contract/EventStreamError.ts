/**
 * @fileoverview EventStream error type for voltaire-effect.
 *
 * @module EventStreamError
 * @since 0.3.0
 */

import * as Data from "effect/Data";

/**
 * Error thrown when an EventStream operation fails.
 *
 * @since 0.3.0
 */
export class EventStreamError extends Data.TaggedError("EventStreamError")<{
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
