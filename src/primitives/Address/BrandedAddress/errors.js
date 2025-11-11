import {
	InvalidFormatError,
	InvalidLengthError,
	PrimitiveError,
	ValidationError,
} from "../../errors/index.js";

/**
 * Error thrown when address hex format is invalid
 *
 * @throws {InvalidHexFormatError}
 */
export class InvalidHexFormatError extends InvalidFormatError {
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
		super(message || "Invalid hex format for address", {
			code: options?.code || "INVALID_HEX_FORMAT",
			value: options?.value,
			expected: options?.expected || "0x-prefixed hex string",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/address/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidHexFormatError";
	}
}

/**
 * Error thrown when hex string contains invalid characters
 *
 * @throws {InvalidHexStringError}
 */
export class InvalidHexStringError extends InvalidFormatError {
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
		super(message || "Invalid hex string", {
			code: options?.code || "INVALID_HEX_STRING",
			value: options?.value,
			expected:
				options?.expected || "Valid hexadecimal characters (0-9, a-f, A-F)",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/address/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidHexStringError";
	}
}

/**
 * Error thrown when address has invalid length
 *
 * @throws {InvalidAddressLengthError}
 */
export class InvalidAddressLengthError extends InvalidLengthError {
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
		super(message || "Invalid address length", {
			code: options?.code || "INVALID_ADDRESS_LENGTH",
			value: options?.value,
			expected: options?.expected || "20 bytes",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/address/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidAddressLengthError";
	}
}

/**
 * Error thrown when value is invalid
 *
 * @throws {InvalidValueError}
 */
export class InvalidValueError extends ValidationError {
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
			code: options?.code || "INVALID_VALUE",
			value: options?.value,
			expected: options?.expected || "Valid value",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/address/fundamentals#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidValueError";
	}
}

/**
 * Error thrown when feature is not implemented
 *
 * @throws {NotImplementedError}
 */
export class NotImplementedError extends PrimitiveError {
	/**
	 * @param {string} [message] - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Root cause error
	 */
	constructor(message, options) {
		super(message || "Not implemented", {
			code: options?.code || "NOT_IMPLEMENTED",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "NotImplementedError";
	}
}
