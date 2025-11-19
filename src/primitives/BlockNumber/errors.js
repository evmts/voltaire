export class InvalidBlockNumberError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBlockNumberError";
		if (details) {
			this.details = details;
		}
	}
}
