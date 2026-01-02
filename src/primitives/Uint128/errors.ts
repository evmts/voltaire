import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
	ValidationError,
} from "../errors/index.js";

const MAX = 2n ** 128n - 1n;
const TYPE_NAME = "Uint128";

/**
 * Error thrown when Uint128 value is negative
 */
export class Uint128NegativeError extends IntegerUnderflowError {
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
			code: options.code || "UINT128_NEGATIVE",
			value: options.value,
			min: 0n,
			type: TYPE_NAME,
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint128#error-handling",
			cause: options.cause,
		});
		this.name = "Uint128NegativeError";
	}
}

/**
 * Error thrown when Uint128 value exceeds maximum (2^128 - 1)
 */
export class Uint128OverflowError extends IntegerOverflowError {
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
			code: options.code || "UINT128_OVERFLOW",
			value: options.value,
			max: MAX,
			type: TYPE_NAME,
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint128#error-handling",
			cause: options.cause,
		});
		this.name = "Uint128OverflowError";
	}
}

/**
 * Error thrown when Uint128 byte length is invalid
 */
export class Uint128InvalidLengthError extends InvalidLengthError {
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
			code: options.code || "UINT128_INVALID_LENGTH",
			value: options.value,
			expected: options.expected,
			context: { ...options.context, actualLength: options.actualLength },
			docsPath: options.docsPath || "/primitives/uint128#error-handling",
			cause: options.cause,
		});
		this.name = "Uint128InvalidLengthError";
	}
}

/**
 * Error thrown when division or modulo by zero
 */
export class Uint128DivisionByZeroError extends InvalidRangeError {
	constructor(
		message?: string,
		options?: {
			code?: string;
			dividend?: bigint;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message || "Division by zero", {
			code: options?.code || "UINT128_DIVISION_BY_ZERO",
			value: options?.dividend ?? 0n,
			expected: "Non-zero divisor",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/uint128#error-handling",
			cause: options?.cause,
		});
		this.name = "Uint128DivisionByZeroError";
	}
}

/**
 * Error thrown when Uint128 value is not an integer
 */
export class Uint128NotIntegerError extends InvalidFormatError {
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
			code: options.code || "UINT128_NOT_INTEGER",
			value: options.value,
			expected: "Integer value",
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint128#error-handling",
			cause: options.cause,
		});
		this.name = "Uint128NotIntegerError";
	}
}

/**
 * Error thrown when value exceeds safe integer range for number conversion
 */
export class Uint128SafeIntegerOverflowError extends IntegerOverflowError {
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
			code: options.code || "UINT128_SAFE_INTEGER_OVERFLOW",
			value: options.value,
			max: Number.MAX_SAFE_INTEGER,
			type: "safe integer",
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint128#error-handling",
			cause: options.cause,
		});
		this.name = "Uint128SafeIntegerOverflowError";
	}
}

/**
 * Error thrown when min/max operation requires at least one value
 */
export class Uint128EmptyInputError extends ValidationError {
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
			code: options?.code || "UINT128_EMPTY_INPUT",
			value: options?.value ?? [],
			expected: options?.expected || "At least one value",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/uint128#error-handling",
			cause: options?.cause,
		});
		this.name = "Uint128EmptyInputError";
	}
}
