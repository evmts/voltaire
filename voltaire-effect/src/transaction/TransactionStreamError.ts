/**
 * @fileoverview TransactionStream error type for voltaire-effect.
 *
 * @module TransactionStreamError
 * @since 0.2.13
 */

import { AbstractError } from "@tevm/voltaire/errors";

/**
 * Error thrown when a TransactionStream operation fails.
 *
 * @since 0.2.13
 */
export class TransactionStreamError extends AbstractError {
	readonly _tag = "TransactionStreamError" as const;

	constructor(
		message: string,
		options?: {
			cause?: Error;
			context?: Record<string, unknown>;
		},
	) {
		super(message, options);
		this.name = "TransactionStreamError";
	}
}
