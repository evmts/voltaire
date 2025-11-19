/**
 * Error thrown when TypedData is invalid
 */
export class InvalidTypedDataError extends Error {
	constructor(message, context) {
		super(message);
		this.name = "InvalidTypedDataError";
		this.context = context;
	}
}
