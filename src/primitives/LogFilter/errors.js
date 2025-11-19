/**
 * Error thrown when LogFilter is invalid
 */
export class InvalidLogFilterError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidLogFilterError";
		if (details) {
			this.details = details;
		}
	}
}
