import { PrimitiveError, ValidationError } from "../errors/index.js";

export class TokenBalanceError extends PrimitiveError {
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
			code: options?.code || "TOKEN_BALANCE_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-balance",
			cause: options?.cause,
		});
		this.name = "TokenBalanceError";
	}
}

export class InvalidTokenBalanceError extends ValidationError {
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
			code: options?.code || "INVALID_TOKEN_BALANCE",
			value: options?.value,
			expected: options?.expected,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-balance",
			cause: options?.cause,
		});
		this.name = "InvalidTokenBalanceError";
	}
}

export class TokenBalanceOverflowError extends ValidationError {
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
			code: options?.code || "TOKEN_BALANCE_OVERFLOW",
			value: options?.value,
			expected: options?.expected,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-balance",
			cause: options?.cause,
		});
		this.name = "TokenBalanceOverflowError";
	}
}
