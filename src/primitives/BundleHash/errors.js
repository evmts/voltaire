/**
 * Error thrown when BundleHash operations fail
 */
export class InvalidBundleHashError extends Error {
	/**
	 * @param {string} message - Error message
	 * @param {Record<string, unknown>} [details] - Error details
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidBundleHashError";
		this.details = details;
	}
}
