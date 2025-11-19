// @ts-nocheck

/**
 * Error thrown when bundle operations fail
 */
export class InvalidBundleError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidBundleError";
		this.details = details;
	}
}
