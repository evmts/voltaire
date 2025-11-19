// @ts-nocheck

/**
 * Error thrown when BundleHash operations fail
 */
export class InvalidBundleHashError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidBundleHashError";
		this.details = details;
	}
}
