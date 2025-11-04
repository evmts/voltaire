/**
 * Error thrown when encoding function data fails
 */
export class FunctionEncodingError extends Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "FunctionEncodingError";
	}
}

/**
 * Error thrown when decoding function data fails
 */
export class FunctionDecodingError extends Error {
	/**
	 * @param {string} message - Error message
	 */
	constructor(message) {
		super(message);
		this.name = "FunctionDecodingError";
	}
}

/**
 * Error thrown when function selector doesn't match
 */
export class FunctionInvalidSelectorError extends Error {
	/**
	 * @param {string} [message] - Error message
	 */
	constructor(message = "Function selector mismatch") {
		super(message);
		this.name = "FunctionInvalidSelectorError";
	}
}
