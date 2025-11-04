/**
 * Error thrown when an invalid address length is provided
 */
export class InvalidAddressLengthError extends Error {
	constructor() {
		super("Invalid address length");
		this.name = "InvalidAddressLengthError";
	}
}

/**
 * Error thrown when an invalid key length is provided
 */
export class InvalidKeyLengthError extends Error {
	constructor() {
		super("Invalid key length");
		this.name = "InvalidKeyLengthError";
	}
}

/**
 * Error thrown when tree is in invalid state
 */
export class InvalidTreeStateError extends Error {
	constructor() {
		super("Invalid tree state");
		this.name = "InvalidTreeStateError";
	}
}
