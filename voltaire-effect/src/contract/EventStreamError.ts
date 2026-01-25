/**
 * @fileoverview EventStream error type for voltaire-effect.
 *
 * @module EventStreamError
 * @since 0.3.0
 */

import { AbstractError } from "@tevm/voltaire/errors";

/**
 * Error thrown when an EventStream operation fails.
 *
 * @since 0.3.0
 */
export class EventStreamError extends AbstractError {
	readonly _tag = "EventStreamError" as const;

	constructor(
		message: string,
		options?: {
			cause?: Error;
			context?: Record<string, unknown>;
		},
	) {
		super(message, options);
		this.name = "EventStreamError";
	}
}
