export class InvalidTransactionIndexError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidTransactionIndexError";
		if (details) {
			this.details = details;
		}
	}
}
