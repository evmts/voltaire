/**
 * @fileoverview Block module error types for voltaire-effect.
 *
 * @module BlockError
 * @since 0.3.0
 */

import { AbstractError } from "@tevm/voltaire/errors";

/**
 * Error thrown when a block operation fails.
 *
 * @since 0.3.0
 */
export class BlockError extends AbstractError {
	readonly _tag = "BlockError" as const;

	constructor(
		message: string,
		options?: {
			cause?: Error;
			context?: Record<string, unknown>;
		},
	) {
		super(message, options);
		this.name = "BlockError";
	}
}

/**
 * Error thrown when a block is not found.
 *
 * @since 0.3.0
 */
export class BlockNotFoundError extends AbstractError {
	readonly _tag = "BlockNotFoundError" as const;

	constructor(
		readonly identifier: string | bigint,
		options?: { cause?: Error },
	) {
		super(
			`Block ${typeof identifier === "bigint" ? identifier.toString() : identifier} not found`,
			options,
		);
		this.name = "BlockNotFoundError";
	}
}
