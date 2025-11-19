/**
 * Error thrown when DomainSeparator length is invalid
 */
export class InvalidDomainSeparatorLengthError extends Error {
	constructor(message, context) {
		super(message);
		this.name = "InvalidDomainSeparatorLengthError";
		this.context = context;
	}
}
