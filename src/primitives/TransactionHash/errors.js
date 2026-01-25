import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";

/**
 * @typedef {object} ErrorDetails
 * @property {unknown} [value]
 * @property {string} [expected]
 * @property {Record<string, unknown>} [context]
 * @property {string} [docsPath]
 * @property {Error} [cause]
 */

/**
 * Error thrown when TransactionHash byte length is invalid
 * @extends {InvalidLengthError}
 */
export class InvalidTransactionHashLengthError extends InvalidLengthError {
	/**
	 * @param {string} [message]
	 * @param {ErrorDetails} [options]
	 */
	constructor(message, options) {
		super(message || "Invalid TransactionHash length", {
			code: -32602,
			value: options?.value,
			expected: options?.expected || "32 bytes",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/transaction-hash#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTransactionHashLengthError";
	}
}

/**
 * Error thrown when TransactionHash format is invalid
 * @extends {InvalidFormatError}
 */
export class InvalidTransactionHashFormatError extends InvalidFormatError {
	/**
	 * @param {string} [message]
	 * @param {ErrorDetails} [options]
	 */
	constructor(message, options) {
		super(message || "Invalid TransactionHash format", {
			code: -32602,
			value: options?.value,
			expected: options?.expected || "valid hex string",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/transaction-hash#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTransactionHashFormatError";
	}
}
