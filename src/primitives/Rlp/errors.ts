export type ErrorType =
	| "InputTooShort"
	| "InputTooLong"
	| "LeadingZeros"
	| "NonCanonicalSize"
	| "InvalidLength"
	| "UnexpectedInput"
	| "InvalidRemainder"
	| "ExtraZeros"
	| "RecursionDepthExceeded";

export class Error extends globalThis.Error {
	constructor(
		public readonly type: ErrorType,
		message?: string,
	) {
		super(message || type);
		this.name = "RlpError";
	}
}

// Legacy export
export const RlpError = Error;
export type RlpErrorType = ErrorType;
