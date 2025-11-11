import { CryptoError } from "../../primitives/errors/CryptoError.js";
import { InvalidFormatError } from "../../primitives/errors/ValidationError.js";

/**
 * Base EIP-712 error
 *
 * @example
 * ```javascript
 * throw new Eip712Error('EIP-712 operation failed', {
 *   code: 'EIP712_ERROR',
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/eip712#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712Error extends CryptoError {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "EIP712_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Eip712Error";
	}
}

/**
 * EIP-712 encoding error
 *
 * @example
 * ```javascript
 * throw new Eip712EncodingError('Failed to encode value', {
 *   code: 'EIP712_ENCODING_ERROR',
 *   context: { type: 'address', value: '0x...' },
 *   docsPath: '/crypto/eip712/encode-value#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712EncodingError extends Eip712Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "EIP712_ENCODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Eip712EncodingError";
	}
}

/**
 * EIP-712 type not found error
 *
 * @example
 * ```javascript
 * throw new Eip712TypeNotFoundError('Type Person not found', {
 *   code: 'EIP712_TYPE_NOT_FOUND',
 *   context: { type: 'Person' },
 *   docsPath: '/crypto/eip712/encode-type#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712TypeNotFoundError extends Eip712Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "EIP712_TYPE_NOT_FOUND",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Eip712TypeNotFoundError";
	}
}

/**
 * EIP-712 invalid message error
 *
 * @example
 * ```javascript
 * throw new Eip712InvalidMessageError('Missing required field', {
 *   code: 'EIP712_INVALID_MESSAGE',
 *   context: { field: 'name' },
 *   docsPath: '/crypto/eip712/encode-data#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712InvalidMessageError extends Eip712Error {
	/**
	 * @param {string} message
	 * @param {{code?: string, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "EIP712_INVALID_MESSAGE",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Eip712InvalidMessageError";
	}
}
