/**
 * Base error for P256 operations
 */
export class P256Error extends Error {
	constructor(message) {
		super(message);
		this.name = "P256Error";
	}
}

/**
 * Error for invalid signatures
 */
export class InvalidSignatureError extends P256Error {
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error for invalid public keys
 */
export class InvalidPublicKeyError extends P256Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error for invalid private keys
 */
export class InvalidPrivateKeyError extends P256Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPrivateKeyError";
	}
}
