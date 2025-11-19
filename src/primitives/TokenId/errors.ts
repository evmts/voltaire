import { PrimitiveError, ValidationError } from "../errors/index.js";

export class TokenIdError extends PrimitiveError {
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
			code: options?.code || "TOKEN_ID_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-id",
			cause: options?.cause,
		});
		this.name = "TokenIdError";
	}
}

export class InvalidTokenIdError extends ValidationError {
	constructor(
		message: string,
		options?: {
			code?: string;
			value?: unknown;
			expected?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "INVALID_TOKEN_ID",
			value: options?.value,
			expected: options?.expected,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-id",
			cause: options?.cause,
		});
		this.name = "InvalidTokenIdError";
	}
}
