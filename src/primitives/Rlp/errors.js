/**
 * @typedef {"InputTooShort" | "InputTooLong" | "LeadingZeros" | "NonCanonicalSize" | "InvalidLength" | "UnexpectedInput" | "InvalidRemainder" | "ExtraZeros" | "RecursionDepthExceeded"} ErrorType
 */

export class Error extends globalThis.Error {
	/**
	 * @param {ErrorType} type
	 * @param {string} [message]
	 */
	constructor(type, message) {
		super(message || type);
		this.name = "RlpError";
		this.type = type;
	}
}

// Legacy export
export const RlpError = Error;
