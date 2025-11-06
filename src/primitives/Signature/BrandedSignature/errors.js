/**
 * Base error for Signature operations
 */
export class SignatureError extends Error {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "SignatureError";
	}
}

/**
 * Error for invalid signature length
 */
export class InvalidSignatureLengthError extends SignatureError {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureLengthError";
	}
}

/**
 * Error for invalid signature format
 */
export class InvalidSignatureFormatError extends SignatureError {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureFormatError";
	}
}

/**
 * Error for invalid signature algorithm
 */
export class InvalidAlgorithmError extends SignatureError {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "InvalidAlgorithmError";
	}
}

/**
 * Error for non-canonical signature
 */
export class NonCanonicalSignatureError extends SignatureError {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "NonCanonicalSignatureError";
	}
}

/**
 * Error for invalid DER encoding
 */
export class InvalidDERError extends SignatureError {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = "InvalidDERError";
	}
}
