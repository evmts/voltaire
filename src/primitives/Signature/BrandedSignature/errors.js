/**
 * Base error for Signature operations
 */
export class SignatureError extends Error {
	constructor(message) {
		super(message);
		this.name = "SignatureError";
	}
}

/**
 * Error for invalid signature length
 */
export class InvalidSignatureLengthError extends SignatureError {
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureLengthError";
	}
}

/**
 * Error for invalid signature format
 */
export class InvalidSignatureFormatError extends SignatureError {
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureFormatError";
	}
}

/**
 * Error for invalid signature algorithm
 */
export class InvalidAlgorithmError extends SignatureError {
	constructor(message) {
		super(message);
		this.name = "InvalidAlgorithmError";
	}
}

/**
 * Error for non-canonical signature
 */
export class NonCanonicalSignatureError extends SignatureError {
	constructor(message) {
		super(message);
		this.name = "NonCanonicalSignatureError";
	}
}

/**
 * Error for invalid DER encoding
 */
export class InvalidDERError extends SignatureError {
	constructor(message) {
		super(message);
		this.name = "InvalidDERError";
	}
}
