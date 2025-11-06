/**
 * Base error for all primitive-related errors
 */
export class PrimitiveError extends Error {
	code: string;
	context?: Record<string, any>;

	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message);
		this.name = "PrimitiveError";
		this.code = options?.code || "PRIMITIVE_ERROR";
		this.context = options?.context;

		// Maintains proper stack trace for where error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
