/**
 * Error thrown when FilterId is invalid
 */
export class InvalidFilterIdError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidFilterIdError";
		if (details) {
			this.details = details;
		}
	}
}
