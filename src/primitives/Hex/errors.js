import {
	InvalidFormatError as BaseInvalidFormatError,
	InvalidLengthError as BaseInvalidLengthError,
	InvalidRangeError as BaseInvalidRangeError,
} from "../errors/index.js";

/**
 * Error for invalid hex format (missing 0x prefix)
 */
export class InvalidFormatError extends BaseInvalidFormatError {
	constructor(message = "Invalid hex format: missing 0x prefix", options = {}) {
		super(message, {
			code: options.code || "HEX_INVALID_FORMAT",
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
	constructor(message = "Invalid hex length", options = {}) {
		super(message, {
			code: options.code || "HEX_INVALID_LENGTH",
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
	constructor(message = "Invalid hex character", options = {}) {
		super(message, {
			code: options.code || "HEX_INVALID_CHARACTER",
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
	constructor(message = "Odd length hex string", options = {}) {
		super(message, {
			code: options.code || "HEX_ODD_LENGTH",
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
 * @extends {BaseInvalidLengthError}
 */
export class SizeExceededError extends BaseInvalidLengthError {
	/**
	 * @param {string} [message]
	 * @param {Object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Hex size exceeds target size", options = {}) {
		super(message, {
			code: options.code || "HEX_SIZE_EXCEEDED",
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
 * @extends {BaseInvalidRangeError}
 */
export class InvalidBooleanHexError extends BaseInvalidRangeError {
	/**
	 * @param {string} [message]
	 * @param {Object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Invalid boolean hex value", options = {}) {
		super(message, {
			code: options.code || "HEX_INVALID_BOOLEAN",
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
 * @extends {BaseInvalidRangeError}
 */
export class NegativeNumberError extends BaseInvalidRangeError {
	/**
	 * @param {string} [message]
	 * @param {Object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Number must be non-negative", options = {}) {
		super(message, {
			code: options.code || "HEX_NEGATIVE_NUMBER",
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
 * @extends {BaseInvalidRangeError}
 */
export class UnsafeIntegerError extends BaseInvalidRangeError {
	/**
	 * @param {string} [message]
	 * @param {Object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Number exceeds MAX_SAFE_INTEGER", options = {}) {
		super(message, {
			code: options.code || "HEX_UNSAFE_INTEGER",
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
 * @extends {BaseInvalidRangeError}
 */
export class NonIntegerError extends BaseInvalidRangeError {
	/**
	 * @param {string} [message]
	 * @param {Object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message = "Number must be an integer", options = {}) {
		super(message, {
			code: options.code || "HEX_NON_INTEGER",
			value: options.value,
			expected: options.expected || "integer value",
			context: options.context,
			docsPath: options.docsPath || "/primitives/hex#error-handling",
			cause: options.cause,
		});
		this.name = "NonIntegerError";
	}
}

// Re-export for backward compatibility
export const InvalidHexFormatError = InvalidFormatError;
export const InvalidHexCharacterError = InvalidCharacterError;
export const OddLengthHexError = OddLengthError;
export const InvalidHexLengthError = InvalidLengthError;
