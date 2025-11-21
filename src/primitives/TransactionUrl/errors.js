/**
 * Error thrown when a transaction URL is invalid or malformed
 */
export class InvalidTransactionUrlError extends Error {
	/**
	 * @param {string} message - Error message
	 * @param {Record<string, unknown>} [details] - Additional error details
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidTransactionUrlError";
		this.details = details;
		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, InvalidTransactionUrlError);
		}
	}
}
