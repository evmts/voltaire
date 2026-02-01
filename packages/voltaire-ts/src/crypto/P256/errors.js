import {
	InvalidPrivateKeyError as BaseInvalidPrivateKeyError,
	InvalidPublicKeyError as BaseInvalidPublicKeyError,
	InvalidSignatureError as BaseInvalidSignatureError,
	CryptoError,
} from "../../primitives/errors/CryptoError.js";

/**
 * Base error for P256 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class P256Error extends CryptoError {
	/** @override @readonly */
	_tag = "P256Error";
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
		this.name = "P256Error";
	}
}

/**
 * Error for invalid signatures
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
	/** @override @readonly */
	_tag = "InvalidSignatureError";
	/**
	 * @param {string} message
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32001,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error for invalid public keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
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

/**
 * Error for invalid private keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPrivateKeyError extends BaseInvalidPrivateKeyError {
	/** @override @readonly */
	_tag = "InvalidPrivateKeyError";
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
		this.name = "InvalidPrivateKeyError";
	}
}
