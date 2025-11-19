export class InvalidBlockHashLengthError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 * @param {Record<string, unknown>} [details.context]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBlockHashLengthError";
		if (details) {
			this.details = details;
		}
	}
}

export class InvalidBlockHashFormatError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBlockHashFormatError";
		if (details) {
			this.details = details;
		}
	}
}
