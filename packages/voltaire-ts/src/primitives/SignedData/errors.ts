/**
 * Error thrown when signed data has invalid version byte
 */
export class InvalidSignedDataVersionError extends Error {
	constructor(message: string, context?: unknown) {
		super(message);
		this.name = "InvalidSignedDataVersionError";
		this.context = context;
	}

	context?: unknown;
}

/**
 * Error thrown when signed data has invalid format
 */
export class InvalidSignedDataFormatError extends Error {
	constructor(message: string, context?: unknown) {
		super(message);
		this.name = "InvalidSignedDataFormatError";
		this.context = context;
	}

	context?: unknown;
}

/**
 * Error thrown when signature verification fails
 */
export class SignatureVerificationError extends Error {
	constructor(message: string, context?: unknown) {
		super(message);
		this.name = "SignatureVerificationError";
		this.context = context;
	}

	context?: unknown;
}
