export class InvalidLogIndexError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidLogIndexError";
		if (details) {
			this.details = details;
		}
	}
}
