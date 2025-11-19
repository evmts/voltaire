// @ts-nocheck

/**
 * Error thrown when RelayData operations fail
 */
export class InvalidRelayDataError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidRelayDataError";
		this.details = details;
	}
}
