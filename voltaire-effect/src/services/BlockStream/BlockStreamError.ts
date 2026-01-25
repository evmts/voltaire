/**
 * @fileoverview BlockStream error type for voltaire-effect.
 *
 * @module BlockStreamError
 * @since 0.2.12
 */

import { AbstractError } from "@tevm/voltaire/errors";

/**
 * Error thrown when a BlockStream operation fails.
 *
 * @since 0.2.12
 */
export class BlockStreamError extends AbstractError {
	readonly _tag = "BlockStreamError" as const;

	constructor(
		message: string,
		options?: {
			cause?: Error;
			context?: Record<string, unknown>;
		},
	) {
		super(message, options);
		this.name = "BlockStreamError";
	}
}
