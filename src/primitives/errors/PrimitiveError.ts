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
	override readonly _tag: string = "PrimitiveError";
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "PrimitiveError";
	}
}
