import { AbstractError } from "./AbstractError.js";

/**
 * Base error for all primitive-related errors
 *
 * @example
 * ```typescript
 * throw new PrimitiveError('Invalid primitive value', {
 *   code: 'INVALID_PRIMITIVE',
 *   context: { value: '0x123' },
 *   docsPath: '/primitives/overview#errors'
 * })
 * ```
 */
export class PrimitiveError extends AbstractError {
	constructor(
		message: string,
		options?: {
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "PRIMITIVE_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "PrimitiveError";
	}
}
