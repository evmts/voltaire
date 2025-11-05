/**
 * Authorization validation error
 */
export class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "AuthorizationValidationError";
	}
}
