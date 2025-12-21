export class InvalidBytesLengthError extends Error {
	/**
	 * @param {string} message
	 * @param {*} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBytesLengthError";
		this.details = details;
	}
}

export class InvalidBytesFormatError extends Error {
	/**
	 * @param {string} message
	 * @param {*} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBytesFormatError";
		this.details = details;
	}
}

export class InvalidValueError extends Error {
	/**
	 * @param {string} message
	 * @param {*} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidValueError";
		this.details = details;
	}
}
