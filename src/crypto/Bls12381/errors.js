import {
	CryptoError,
	InvalidPrivateKeyError as BaseInvalidPrivateKeyError,
	InvalidSignatureError as BaseInvalidSignatureError,
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
 *   code: 'BLS12381_ERROR',
 *   context: { operation: 'pairing' },
 *   docsPath: '/crypto/bls12-381#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Bls12381Error extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BLS12381_ERROR",
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
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Point is not on the BLS12-381 curve", {
			code: options?.code || "BLS12381_INVALID_POINT",
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
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Point is not in the correct subgroup", {
			code: options?.code || "BLS12381_INVALID_SUBGROUP",
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
 *   code: 'BLS12381_INVALID_SCALAR_LENGTH',
 *   context: { length: 16, expected: 32 }
 * })
 * ```
 */
export class InvalidScalarError extends BaseInvalidPrivateKeyError {
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Invalid scalar value", {
			code: options?.code || "BLS12381_INVALID_SCALAR",
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
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Invalid field element", {
			code: options?.code || "BLS12381_INVALID_FIELD_ELEMENT",
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
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Pairing operation failed", {
			code: options?.code || "BLS12381_PAIRING_ERROR",
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
	/**
	 * @param {string} [message]
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message ?? "Signature operation failed", {
			code: options?.code || "BLS12381_SIGNATURE_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/bls12-381#error-handling",
			cause: options?.cause,
		});
		this.name = "SignatureError";
	}
}
