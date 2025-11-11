/**
 * Base error for P256 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class P256Error extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "P256Error";
	}
}

/**
 * Error for invalid signatures
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidSignatureError extends P256Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error for invalid public keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPublicKeyError extends P256Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Error for invalid private keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPrivateKeyError extends P256Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidPrivateKeyError";
	}
}
