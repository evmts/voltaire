import { InvalidRangeError, ValidationError } from "../../errors/index.js";

/**
 * Error thrown when Uint value is negative
 *
 * @throws {UintNegativeError}
 */
export class UintNegativeError extends InvalidRangeError {
	constructor(
		message: string,
		options?: {
			code?: string;
			value: unknown;
			expected?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "UINT_NEGATIVE",
			value: options?.value,
			expected: options?.expected || "Non-negative value",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "UintNegativeError";
	}
}

/**
 * Error thrown when Uint value exceeds maximum
 *
 * @throws {UintOverflowError}
 */
export class UintOverflowError extends InvalidRangeError {
	constructor(
		message: string,
		options?: {
			code?: string;
			value: unknown;
			expected?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code || "UINT_OVERFLOW",
			value: options?.value,
			expected: options?.expected || "Value <= 2^256 - 1",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "UintOverflowError";
	}
}

/**
 * Error thrown when Uint length is invalid
 *
 * @throws {UintInvalidLengthError}
 */
export class UintInvalidLengthError extends ValidationError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_INVALID_LENGTH",
			value: options.value,
			expected: options.expected,
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintInvalidLengthError";
	}
}

/**
 * Error thrown when Uint operation requires at least one value
 *
 * @throws {UintEmptyInputError}
 */
export class UintEmptyInputError extends ValidationError {
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
			code: options?.code || "UINT_EMPTY_INPUT",
			value: options?.value ?? undefined,
			expected: options?.expected || "At least one value",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "UintEmptyInputError";
	}
}
