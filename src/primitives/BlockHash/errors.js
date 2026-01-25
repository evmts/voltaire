import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";

/**
 * Error thrown when BlockHash byte length is invalid
 * @extends {InvalidLengthError}
 */
export class InvalidBlockHashLengthError extends InvalidLengthError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid BlockHash length", {
			code: -32602,
			value: options?.value,
			expected: options?.expected || "32 bytes",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/block-hash#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlockHashLengthError";
	}
}

/**
 * Error thrown when BlockHash format is invalid
 * @extends {InvalidFormatError}
 */
export class InvalidBlockHashFormatError extends InvalidFormatError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid BlockHash format", {
			code: -32602,
			value: options?.value,
			expected: options?.expected || "valid hex string",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/block-hash#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlockHashFormatError";
	}
}
