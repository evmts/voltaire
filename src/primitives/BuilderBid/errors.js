// @ts-nocheck

/**
 * Error thrown when BuilderBid operations fail
 */
export class InvalidBuilderBidError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidBuilderBidError";
		this.details = details;
	}
}
