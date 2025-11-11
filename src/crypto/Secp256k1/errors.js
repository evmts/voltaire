// @ts-nocheck
/**
 * Base error for secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1Error } from './crypto/Secp256k1/index.js';
 * throw new Secp256k1Error('Invalid operation');
 * ```
 */
export class Secp256k1Error extends Error {
	constructor(message) {
		super(message);
		this.name = "Secp256k1Error";
	}
}

/**
 * Error for invalid signatures
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidSignatureError } from './crypto/Secp256k1/index.js';
 * throw new InvalidSignatureError('Invalid signature');
 * ```
 */
export class InvalidSignatureError extends Secp256k1Error {
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
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidPublicKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPublicKeyError('Invalid public key');
 * ```
 */
export class InvalidPublicKeyError extends Secp256k1Error {
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
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidPrivateKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPrivateKeyError('Invalid private key');
 * ```
 */
export class InvalidPrivateKeyError extends Secp256k1Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPrivateKeyError";
	}
}
