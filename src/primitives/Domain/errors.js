/**
 * Error thrown when Domain is invalid
 */
export class InvalidDomainError extends Error {
	/**
	 * @param {string} message
	 * @param {*} [context]
	 */
	constructor(message, context) {
		super(message);
		this.name = "InvalidDomainError";
		this.context = context;
	}
}
