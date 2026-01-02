import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
} from "../errors/index.js";

const MAX = 65535;
const TYPE_NAME = "Uint16";

/**
 * Error thrown when Uint16 value is negative
 */
export class Uint16NegativeError extends IntegerUnderflowError {
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
			code: options.code || "UINT16_NEGATIVE",
			value: options.value,
			min: 0,
			type: TYPE_NAME,
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16NegativeError";
	}
}

/**
 * Error thrown when Uint16 value exceeds maximum (65535)
 */
export class Uint16OverflowError extends IntegerOverflowError {
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
			code: options.code || "UINT16_OVERFLOW",
			value: options.value,
			max: MAX,
			type: TYPE_NAME,
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16OverflowError";
	}
}

/**
 * Error thrown when Uint16 subtraction would underflow
 */
export class Uint16UnderflowError extends IntegerUnderflowError {
	constructor(
		message: string,
		options: {
			code?: string;
			a: number;
			b: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options.code || "UINT16_UNDERFLOW",
			value: options.a - options.b,
			min: 0,
			type: TYPE_NAME,
			context: { ...options.context, a: options.a, b: options.b },
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16UnderflowError";
	}
}

/**
 * Error thrown when Uint16 byte length is invalid
 */
export class Uint16InvalidLengthError extends InvalidLengthError {
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
			code: options.code || "UINT16_INVALID_LENGTH",
			value: options.value,
			expected: options.expected,
			context: { ...options.context, actualLength: options.actualLength },
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16InvalidLengthError";
	}
}

/**
 * Error thrown when division or modulo by zero
 */
export class Uint16DivisionByZeroError extends InvalidRangeError {
	constructor(
		message?: string,
		options?: {
			code?: string;
			dividend?: number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message || "Division by zero", {
			code: options?.code || "UINT16_DIVISION_BY_ZERO",
			value: options?.dividend ?? 0,
			expected: "Non-zero divisor",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/uint16#error-handling",
			cause: options?.cause,
		});
		this.name = "Uint16DivisionByZeroError";
	}
}

/**
 * Error thrown when Uint16 value is not an integer
 */
export class Uint16NotIntegerError extends InvalidFormatError {
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
			code: options.code || "UINT16_NOT_INTEGER",
			value: options.value,
			expected: "Integer value",
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16NotIntegerError";
	}
}

/**
 * Error thrown when hex string format is invalid
 */
export class Uint16InvalidHexError extends InvalidFormatError {
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
			code: options.code || "UINT16_INVALID_HEX",
			value: options.value,
			expected: "Valid hex string (0x...)",
			context: options.context,
			docsPath: options.docsPath || "/primitives/uint16#error-handling",
			cause: options.cause,
		});
		this.name = "Uint16InvalidHexError";
	}
}
