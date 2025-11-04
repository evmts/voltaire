/**
 * Error thrown when address hex format is invalid
 */
export class InvalidHexFormatError extends Error {
	constructor(message = "Invalid hex format for address") {
		super(message);
		this.name = "InvalidHexFormatError";
	}
}

/**
 * Error thrown when hex string contains invalid characters
 */
export class InvalidHexStringError extends Error {
	constructor(message = "Invalid hex string") {
		super(message);
		this.name = "InvalidHexStringError";
	}
}

/**
 * Error thrown when address has invalid length
 */
export class InvalidAddressLengthError extends Error {
	constructor(message = "Invalid address length") {
		super(message);
		this.name = "InvalidAddressLengthError";
	}
}

/**
 * Error thrown when value is invalid
 */
export class InvalidValueError extends Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidValueError";
	}
}

/**
 * Error thrown when feature is not implemented
 */
export class NotImplementedError extends Error {
	constructor(message = "Not implemented") {
		super(message);
		this.name = "NotImplementedError";
	}
}
