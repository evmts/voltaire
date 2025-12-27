import {
	InvalidFormatError as BaseInvalidFormatError,
	InvalidLengthError as BaseInvalidLengthError,
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
