import {
	InvalidPrivateKeyError as BaseInvalidPrivateKeyError,
	InvalidSignatureError as BaseInvalidSignatureError,
	CryptoError,
} from "../../primitives/errors/CryptoError.js";

/**
 * BLS12-381 Error Types
 *
 * Error classes for BLS12-381 operations.
 * All errors extend CryptoError from the primitives/errors hierarchy.
 *
 * @since 0.0.0
 */

/**
 * Base error class for BLS12-381 operations
 *
 * @example
 * ```javascript
 * throw new Bls12381Error('BLS12-381 operation failed', {
 *   code: -32000,
 *   context: { operation: 'pairing' },
 *   docsPath: '/crypto/bls12-381#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Bls12381Error extends CryptoError {
	/** @override @readonly @type {string} */
	_tag = "Bls12381Error";
	/**
	 * @param {string} message
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32000,
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/bls12-381#error-handling",
			cause: options?.cause,
		});
		this.name = "Bls12381Error";
	}
}

/**
 * Error thrown when a point is not on the curve
 *
 * @example
 * ```javascript
 * throw new InvalidPointError('G1 point not on curve', {
 *   context: { point: 'G1', x: '0x...', y: '0x...' }
 * })
 * ```
 */
export class InvalidPointError extends Bls12381Error {
	/** @override @readonly */
	_tag = "InvalidPointError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Point is not on the BLS12-381 curve", {
			code: options?.code ?? -32001,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidPointError";
	}
}

/**
 * Error thrown when a point is not in the correct subgroup
 *
 * @example
 * ```javascript
 * throw new InvalidSubgroupError('G2 point not in subgroup', {
 *   context: { group: 'G2' }
 * })
 * ```
 */
export class InvalidSubgroupError extends Bls12381Error {
	/** @override @readonly */
	_tag = "InvalidSubgroupError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Point is not in the correct subgroup", {
			code: options?.code ?? -32002,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidSubgroupError";
	}
}

/**
 * Error thrown when a scalar (private key) is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidScalarError('Private key must be 32 bytes', {
 *   code: -32003,
 *   context: { length: 16, expected: 32 }
 * })
 * ```
 */
export class InvalidScalarError extends BaseInvalidPrivateKeyError {
	/** @override @readonly */
	_tag = "InvalidScalarError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Invalid scalar value", {
			code: options?.code ?? -32003,
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/bls12-381#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidScalarError";
	}
}

/**
 * Error thrown when field element is invalid
 *
 * @example
 * ```javascript
 * throw new InvalidFieldElementError('Field element exceeds modulus', {
 *   context: { field: 'Fp', value: '0x...' }
 * })
 * ```
 */
export class InvalidFieldElementError extends Bls12381Error {
	/** @override @readonly */
	_tag = "InvalidFieldElementError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Invalid field element", {
			code: options?.code ?? -32004,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "InvalidFieldElementError";
	}
}

/**
 * Error thrown when pairing check fails
 *
 * @example
 * ```javascript
 * throw new PairingError('Pairing computation failed', {
 *   context: { operation: 'pairingCheck', pairs: 2 }
 * })
 * ```
 */
export class PairingError extends Bls12381Error {
	/** @override @readonly */
	_tag = "PairingError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Pairing operation failed", {
			code: options?.code ?? -32005,
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "PairingError";
	}
}

/**
 * Error thrown when signature operation fails
 *
 * @example
 * ```javascript
 * throw new SignatureError('Signature verification failed', {
 *   context: { operation: 'verify' }
 * })
 * ```
 */
export class SignatureError extends BaseInvalidSignatureError {
	/** @override @readonly */
	_tag = "SignatureError";
	/**
	 * @param {string} [message]
	 * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Signature operation failed", {
			code: options?.code ?? -32006,
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/bls12-381#error-handling",
			cause: options?.cause,
		});
		this.name = "SignatureError";
	}
}
