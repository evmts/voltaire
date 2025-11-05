/**
 * Base error for X25519 operations
 */
export class X25519Error extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "X25519Error";
	}
}

/**
 * Error thrown when secret key is invalid
 */
export class InvalidSecretKeyError extends X25519Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidSecretKeyError";
	}
}

/**
 * Error thrown when public key is invalid
 */
export class InvalidPublicKeyError extends X25519Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}
