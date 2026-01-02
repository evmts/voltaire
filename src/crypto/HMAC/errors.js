/**
 * HMAC Error classes
 *
 * @module HMAC/errors
 */

/**
 * Error thrown when HMAC key is empty
 */
export class EmptyKeyError extends Error {
	/**
	 * @param {string} [message]
	 */
	constructor(message = "HMAC key cannot be empty") {
		super(message);
		this.name = "EmptyKeyError";
	}
}
