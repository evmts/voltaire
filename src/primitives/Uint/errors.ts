import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
	ValidationError,
} from "../errors/index.js";

/**
 * Error thrown when Uint value is negative
 *
 * @example
 * ```typescript
 * throw new UintNegativeError("Uint256 value cannot be negative", {
 *   value: -1n,
 * });
 * ```
 */
export class UintNegativeError extends IntegerUnderflowError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: bigint | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_NEGATIVE",
			value: options.value,
			min: 0n,
			type: "uint256",
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintNegativeError";
	}
}

/**
 * Error thrown when Uint value exceeds maximum
 *
 * @example
 * ```typescript
 * throw new UintOverflowError("Uint256 value exceeds maximum", {
 *   value: 2n ** 256n,
 *   max: 2n ** 256n - 1n,
 * });
 * ```
 */
export class UintOverflowError extends IntegerOverflowError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: bigint | number;
			max?: bigint | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_OVERFLOW",
			value: options.value,
			max: options.max ?? 2n ** 256n - 1n,
			type: "uint256",
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintOverflowError";
	}
}

/**
 * Error thrown when Uint byte length is invalid
 *
 * @example
 * ```typescript
 * throw new UintInvalidLengthError("Uint256 bytes cannot exceed 32 bytes", {
 *   value: bytes,
 *   expected: "<= 32 bytes",
 *   actualLength: 40,
 * });
 * ```
 */
export class UintInvalidLengthError extends InvalidLengthError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: unknown;
			expected: string;
			actualLength?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_INVALID_LENGTH",
			value: options.value,
			expected: options.expected,
			context: { ...options.context, actualLength: options.actualLength },
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
 * @example
 * ```typescript
 * throw new UintEmptyInputError("min requires at least one value");
 * ```
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
			value: options?.value ?? [],
			expected: options?.expected || "At least one value",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "UintEmptyInputError";
	}
}

/**
 * Error thrown when division or modulo by zero
 *
 * @example
 * ```typescript
 * throw new UintDivisionByZeroError("Division by zero");
 * ```
 */
export class UintDivisionByZeroError extends InvalidRangeError {
	constructor(
		message?: string,
		options?: {
			code?: string;
			dividend?: bigint | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message || "Division by zero", {
			code: options?.code || "UINT_DIVISION_BY_ZERO",
			value: options?.dividend ?? 0n,
			expected: "Non-zero divisor",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "UintDivisionByZeroError";
	}
}

/**
 * Error thrown when Uint value is not an integer
 *
 * @example
 * ```typescript
 * throw new UintNotIntegerError("Uint256 value must be an integer", {
 *   value: 1.5,
 * });
 * ```
 */
export class UintNotIntegerError extends InvalidFormatError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: unknown;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_NOT_INTEGER",
			value: options.value,
			expected: "Integer value",
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintNotIntegerError";
	}
}

/**
 * Error thrown when value exceeds safe integer range for number conversion
 *
 * @example
 * ```typescript
 * throw new UintSafeIntegerOverflowError("Value exceeds MAX_SAFE_INTEGER", {
 *   value: 2n ** 53n,
 * });
 * ```
 */
export class UintSafeIntegerOverflowError extends IntegerOverflowError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: bigint | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_SAFE_INTEGER_OVERFLOW",
			value: options.value,
			max: Number.MAX_SAFE_INTEGER,
			type: "safe integer",
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintSafeIntegerOverflowError";
	}
}

/**
 * Error thrown when hex string format is invalid
 *
 * @example
 * ```typescript
 * throw new UintInvalidHexError("Invalid hex string", {
 *   value: "0xGGG",
 * });
 * ```
 */
export class UintInvalidHexError extends InvalidFormatError {
	constructor(
		message: string,
		options: {
			code?: string;
			value: unknown;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT_INVALID_HEX",
			value: options.value,
			expected: "Valid hex string (0x...)",
			context: options.context,
			docsPath:
				options.docsPath || "/primitives/uint/fundamentals#error-handling",
			cause: options.cause,
		});
		this.name = "UintInvalidHexError";
	}
}
