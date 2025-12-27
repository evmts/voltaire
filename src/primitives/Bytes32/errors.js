import {
	InvalidFormatError,
	InvalidLengthError,
	ValidationError,
} from "../errors/index.js";

/**
 * Error thrown when Bytes32 hex format is invalid
 */
export class InvalidBytes32HexError extends InvalidFormatError {
	/**
	 * @param {string} [message] - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected format
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Root cause error
	 */
	constructor(message, options) {
		super(message || "Invalid hex format for Bytes32", {
			code: options?.code || "INVALID_BYTES32_HEX",
			value: options?.value,
			expected: options?.expected || "0x-prefixed hex string (64 chars)",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bytes32",
			cause: options?.cause,
		});
		this.name = "InvalidBytes32HexError";
	}
}

/**
 * Error thrown when Bytes32 has invalid length
 */
export class InvalidBytes32LengthError extends InvalidLengthError {
	/**
	 * @param {string} [message] - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected length
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Root cause error
	 */
	constructor(message, options) {
		super(message || "Invalid Bytes32 length", {
			code: options?.code || "INVALID_BYTES32_LENGTH",
			value: options?.value,
			expected: options?.expected || "32 bytes",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bytes32",
			cause: options?.cause,
		});
		this.name = "InvalidBytes32LengthError";
	}
}

/**
 * Error thrown when value is invalid for Bytes32
 */
export class InvalidBytes32ValueError extends ValidationError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected value
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Root cause error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "INVALID_BYTES32_VALUE",
			value: options?.value,
			expected: options?.expected || "Valid Bytes32 value",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bytes32",
			cause: options?.cause,
		});
		this.name = "InvalidBytes32ValueError";
	}
}
