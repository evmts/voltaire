/**
 * @typedef {object} ErrorDetails
 * @property {unknown} [value]
 * @property {string} [expected]
 * @property {Record<string, unknown>} [context]
 */

export class InvalidTransactionHashLengthError extends Error {
	/**
	 * @param {string} message
	 * @param {ErrorDetails} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidTransactionHashLengthError";
		if (details) {
			/** @type {ErrorDetails} */
			this.details = details;
		}
	}
}

export class InvalidTransactionHashFormatError extends Error {
	/**
	 * @param {string} message
	 * @param {ErrorDetails} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidTransactionHashFormatError";
		if (details) {
			/** @type {ErrorDetails} */
			this.details = details;
		}
	}
}
