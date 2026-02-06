import {
	DecodingError,
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/index.js";

/**
 * SIWE message format is invalid
 *
 * @throws {InvalidFormatError}
 */
export class InvalidSiweMessageError extends InvalidFormatError {
	/**
	 * @param {string} message - Description of the format issue
	 * @param {object} [options]
	 * @param {unknown} [options.value]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(`Invalid SIWE message: ${message}`, {
			code: -32602,
			value: options?.value,
			expected: "valid SIWE message format",
			docsPath: "/primitives/siwe/parse#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSiweMessageError";
	}
}

/**
 * SIWE message missing required field
 *
 * @throws {InvalidFormatError}
 */
export class MissingFieldError extends InvalidFormatError {
	/**
	 * @param {string} field - Name of the missing field
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(field, options) {
		super(`Missing required field: ${field}`, {
			code: -32602,
			value: field,
			expected: `SIWE message with ${field} field`,
			docsPath: "/primitives/siwe/parse#error-handling",
			cause: options?.cause,
		});
		this.name = "MissingFieldError";
	}
}

/**
 * SIWE message field has invalid value
 *
 * @throws {InvalidFormatError}
 */
export class InvalidFieldError extends InvalidFormatError {
	/**
	 * @param {string} field - Name of the invalid field
	 * @param {string} reason - Why the field is invalid
	 * @param {object} [options]
	 * @param {unknown} [options.value]
	 * @param {Error} [options.cause]
	 */
	constructor(field, reason, options) {
		super(`Invalid ${field}: ${reason}`, {
			code: -32602,
			value: options?.value,
			expected: reason,
			docsPath: "/primitives/siwe/parse#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidFieldError";
	}
}

/**
 * SIWE nonce length is invalid
 *
 * @throws {InvalidLengthError}
 */
export class InvalidNonceLengthError extends InvalidLengthError {
	/**
	 * @param {number} length - Requested nonce length
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(length, options) {
		super("Nonce length must be at least 8 characters", {
			code: -32602,
			value: length,
			expected: ">= 8 characters",
			docsPath: "/primitives/siwe/generate-nonce#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidNonceLengthError";
	}
}

/**
 * SIWE message parsing failed
 *
 * @throws {DecodingError}
 */
export class SiweParseError extends DecodingError {
	/**
	 * @param {string} message - Description of the parse error
	 * @param {object} [options]
	 * @param {unknown} [options.value]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(`Failed to parse SIWE message: ${message}`, {
			code: -32000,
			context: { value: options?.value },
			docsPath: "/primitives/siwe/parse#error-handling",
			cause: options?.cause,
		});
		this.name = "SiweParseError";
	}
}
