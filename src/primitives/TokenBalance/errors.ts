import { PrimitiveError, ValidationError } from "../errors/index.js";

export class TokenBalanceError extends PrimitiveError {
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
			code: options?.code ?? -32000,
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
			code?: number;
			value?: unknown;
			expected?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected ?? "valid token balance",
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
			code?: number;
			value?: unknown;
			expected?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected ?? "value within uint256 range",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/token-balance",
			cause: options?.cause,
		});
		this.name = "TokenBalanceOverflowError";
	}
}
