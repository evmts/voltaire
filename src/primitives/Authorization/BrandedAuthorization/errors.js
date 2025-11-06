/**
 * Authorization validation error
 */
export class ValidationError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "AuthorizationValidationError";
	}
}
