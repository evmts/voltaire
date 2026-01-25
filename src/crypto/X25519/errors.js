import {
	InvalidPublicKeyError as BaseInvalidPublicKeyError,
	CryptoError,
	InvalidPrivateKeyError,
} from "../../primitives/errors/CryptoError.js";

/**
 * Base error for X25519 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519Error } from './crypto/X25519/index.js';
 * throw new X25519Error('Invalid operation', {
 *   code: -32000,
 *   context: { operation: 'scalarmult' },
 *   docsPath: '/crypto/x25519#error-handling'
 * });
 * ```
 */
export class X25519Error extends CryptoError {
	/** @override @readonly */
	_tag = "X25519Error";
	/**
	 * @param {string} message
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32000,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
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
 * throw new InvalidSecretKeyError('Invalid secret key', {
 *   code: -32003,
 *   context: { length: 16, expected: 32 },
 *   docsPath: '/crypto/x25519/scalarmult#error-handling'
 * });
 * ```
 */
export class InvalidSecretKeyError extends InvalidPrivateKeyError {
	/** @override @readonly */
	_tag = "InvalidSecretKeyError";
	/**
	 * @param {string} message
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32003,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
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
 * throw new InvalidPublicKeyError('Invalid public key', {
 *   code: -32002,
 *   context: { length: 16, expected: 32 },
 *   docsPath: '/crypto/x25519/scalarmult#error-handling'
 * });
 * ```
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
	/** @override @readonly */
	_tag = "InvalidPublicKeyError";
	/**
	 * @param {string} message
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32002,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidPublicKeyError";
	}
}
