/**
 * Base error for X25519 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519Error } from './crypto/X25519/index.js';
 * throw new X25519Error('Invalid operation');
 * ```
 */
export class X25519Error extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "X25519Error";
	}
}

/**
 * Error thrown when secret key is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidSecretKeyError } from './crypto/X25519/index.js';
 * throw new InvalidSecretKeyError('Invalid secret key');
 * ```
 */
export class InvalidSecretKeyError extends X25519Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidSecretKeyError";
	}
}

/**
 * Error thrown when public key is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidPublicKeyError } from './crypto/X25519/index.js';
 * throw new InvalidPublicKeyError('Invalid public key');
 * ```
 */
export class InvalidPublicKeyError extends X25519Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}
