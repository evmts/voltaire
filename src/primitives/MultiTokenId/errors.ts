import { PrimitiveError, ValidationError } from "../errors/index.js";

export class MultiTokenIdError extends PrimitiveError {
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
			code: options?.code || "MULTI_TOKEN_ID_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/multi-token-id",
			cause: options?.cause,
		});
		this.name = "MultiTokenIdError";
	}
}

export class InvalidMultiTokenIdError extends ValidationError {
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
			code: options?.code || "INVALID_MULTI_TOKEN_ID",
			value: options?.value,
			expected: options?.expected ?? "valid MultiTokenId",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/multi-token-id",
			cause: options?.cause,
		});
		this.name = "InvalidMultiTokenIdError";
	}
}
