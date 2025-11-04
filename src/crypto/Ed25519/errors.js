/**
 * Base error class for Ed25519 operations
 */
export class Ed25519Error extends Error {
	constructor(message) {
		super(message);
		this.name = "Ed25519Error";
	}
}

/**
 * Error thrown when signature is invalid
 */
export class InvalidSignatureError extends Ed25519Error {
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error thrown when public key is invalid
 */
export class InvalidPublicKeyError extends Ed25519Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error thrown when secret key is invalid
 */
export class InvalidSecretKeyError extends Ed25519Error {
	constructor(message) {
		super(message);
		this.name = "InvalidSecretKeyError";
	}
}

/**
 * Error thrown when seed is invalid
 */
export class InvalidSeedError extends Ed25519Error {
	constructor(message) {
		super(message);
		this.name = "InvalidSeedError";
	}
}
