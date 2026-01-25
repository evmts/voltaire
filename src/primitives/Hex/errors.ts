import {
	InvalidFormatError as BaseInvalidFormatError,
	InvalidLengthError as BaseInvalidLengthError,
	InvalidRangeError as BaseInvalidRangeError,
} from "../errors/index.js";

interface ErrorOptions {
	code?: number;
	value?: unknown;
	expected?: string;
	context?: Record<string, unknown>;
	docsPath?: string;
	cause?: Error;
}

/**
 * Error for invalid hex format (missing 0x prefix)
 */
export class InvalidFormatError extends BaseInvalidFormatError {
	constructor(
		message = "Invalid hex format: missing 0x prefix",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "0x-prefixed hex string",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "InvalidHexFormatError";
	}
}

/**
 * Error for invalid hex length
 */
export class InvalidLengthError extends BaseInvalidLengthError {
	constructor(message = "Invalid hex length", options: ErrorOptions = {}) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "even-length hex string",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "InvalidHexLengthError";
	}
}

/**
 * Error for invalid hex character
 */
export class InvalidCharacterError extends BaseInvalidFormatError {
	constructor(message = "Invalid hex character", options: ErrorOptions = {}) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "valid hex characters (0-9, a-f, A-F)",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "InvalidHexCharacterError";
	}
}

/**
 * Error for odd length hex string
 */
export class OddLengthError extends BaseInvalidLengthError {
	constructor(message = "Odd length hex string", options: ErrorOptions = {}) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "even number of hex characters",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "OddLengthHexError";
	}
}

/**
 * Error for hex size exceeding target size
 */
export class SizeExceededError extends BaseInvalidLengthError {
	constructor(
		message = "Hex size exceeds target size",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "hex that fits within target size",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "HexSizeExceededError";
	}
}

/**
 * Error for invalid boolean hex value
 */
export class InvalidBooleanHexError extends BaseInvalidRangeError {
	constructor(
		message = "Invalid boolean hex value",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "0x0/0x00 or 0x1/0x01",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "InvalidBooleanHexError";
	}
}

/**
 * Error for negative number in hex conversion
 */
export class NegativeNumberError extends BaseInvalidRangeError {
	constructor(
		message = "Number must be non-negative",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "non-negative number",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "NegativeNumberError";
	}
}

/**
 * Error for number exceeding MAX_SAFE_INTEGER
 */
export class UnsafeIntegerError extends BaseInvalidRangeError {
	constructor(
		message = "Number exceeds MAX_SAFE_INTEGER",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || `number <= ${Number.MAX_SAFE_INTEGER}`,
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "UnsafeIntegerError";
	}
}

/**
 * Error for non-integer number
 */
export class NonIntegerError extends BaseInvalidRangeError {
	constructor(
		message = "Number must be an integer",
		options: ErrorOptions = {},
	) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "integer value",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "NonIntegerError";
	}
}

/**
 * Error for invalid size parameter
 */
export class InvalidSizeError extends BaseInvalidRangeError {
	constructor(message = "Invalid size parameter", options: ErrorOptions = {}) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected || "non-negative integer",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "InvalidSizeError";
	}
}

// Re-export for backward compatibility
export const InvalidHexFormatError = InvalidFormatError;
export const InvalidHexCharacterError = InvalidCharacterError;
export const OddLengthHexError = OddLengthError;
export const InvalidHexLengthError = InvalidLengthError;
