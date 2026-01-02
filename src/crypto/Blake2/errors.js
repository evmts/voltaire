import { CryptoError } from "../../primitives/errors/CryptoError.js";

/**
 * Blake2 Error Types
 *
 * @see https://voltaire.tevm.sh/crypto/blake2 for Blake2 documentation
 * @since 0.0.0
 */

/**
 * Base error for Blake2 operations
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Blake2Error } from './crypto/Blake2/errors.js';
 * throw new Blake2Error('Hashing failed', {
 *   code: 'BLAKE2_ERROR',
 *   context: { operation: 'hash' },
 *   docsPath: '/crypto/blake2#error-handling'
 * });
 * ```
 */
export class Blake2Error extends CryptoError {
	/**
	 * @param {string} message - Error message
	 * @param {Object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Underlying error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BLAKE2_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/crypto/blake2#error-handling",
			cause: options?.cause,
		});
		this.name = "Blake2Error";
	}
}

/**
 * Error for invalid output length
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Blake2InvalidOutputLengthError } from './crypto/Blake2/errors.js';
 * throw new Blake2InvalidOutputLengthError(65, {
 *   context: { min: 1, max: 64 },
 *   docsPath: '/crypto/blake2#output-length'
 * });
 * ```
 */
export class Blake2InvalidOutputLengthError extends Blake2Error {
	/**
	 * @param {number} outputLength - The invalid output length
	 * @param {Object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Underlying error
	 */
	constructor(outputLength, options) {
		super(
			`Invalid output length: ${outputLength}. Must be between 1 and 64 bytes.`,
			{
				code: options?.code || "INVALID_OUTPUT_LENGTH",
				context: { outputLength, min: 1, max: 64, ...options?.context },
				docsPath: options?.docsPath || "/crypto/blake2#output-length",
				cause: options?.cause,
			},
		);
		this.name = "Blake2InvalidOutputLengthError";
	}
}

/**
 * Error for invalid input length in EIP-152 compress function
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Blake2InvalidInputLengthError } from './crypto/Blake2/errors.js';
 * throw new Blake2InvalidInputLengthError(200, {
 *   context: { expected: 213 },
 *   docsPath: '/evm/precompiles/blake2f#input-format'
 * });
 * ```
 */
export class Blake2InvalidInputLengthError extends Blake2Error {
	/**
	 * @param {number} actualLength - The actual input length
	 * @param {Object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Underlying error
	 */
	constructor(actualLength, options) {
		super(`Invalid input length: expected 213, got ${actualLength}`, {
			code: options?.code || "INVALID_INPUT_LENGTH",
			context: { actualLength, expected: 213, ...options?.context },
			docsPath: options?.docsPath || "/evm/precompiles/blake2f#input-format",
			cause: options?.cause,
		});
		this.name = "Blake2InvalidInputLengthError";
	}
}
