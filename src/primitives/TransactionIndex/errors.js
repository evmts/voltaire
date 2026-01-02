import { InvalidRangeError } from "../errors/index.js";

/**
 * Error thrown when TransactionIndex is invalid (wrong type, non-integer, or negative)
 * @extends {InvalidRangeError}
 */
export class InvalidTransactionIndexError extends InvalidRangeError {
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
		super(message || "Invalid TransactionIndex", {
			code: "INVALID_TRANSACTION_INDEX",
			value: options?.value,
			expected: options?.expected || "non-negative integer",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/transaction-index#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTransactionIndexError";
	}
}
