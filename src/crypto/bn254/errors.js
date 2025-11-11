import { CryptoError } from "../../primitives/errors/CryptoError.js";

/**
 * BN254 Error Types
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 */

/**
 * Base error for BN254 operations
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254Error } from './crypto/bn254/errors.js';
 * throw new Bn254Error('Operation failed', {
 *   code: 'BN254_ERROR',
 *   context: { operation: 'multiply' },
 *   docsPath: '/crypto/bn254#error-handling'
 * });
 * ```
 */
export class Bn254Error extends CryptoError {
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
			code: options?.code || "BN254_ERROR",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Bn254Error";
	}
}

/**
 * Error for invalid point on curve
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254InvalidPointError } from './crypto/bn254/errors.js';
 * throw new Bn254InvalidPointError('Point not on curve', {
 *   context: { x: '0x...', y: '0x...' },
 *   docsPath: '/crypto/bn254/g1#validation'
 * });
 * ```
 */
export class Bn254InvalidPointError extends Bn254Error {
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
			code: options?.code || "INVALID_CURVE_POINT",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Bn254InvalidPointError";
	}
}

/**
 * Error for point not in correct subgroup
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bn254SubgroupCheckError } from './crypto/bn254/errors.js';
 * throw new Bn254SubgroupCheckError('Point not in subgroup', {
 *   context: { point: '...' },
 *   docsPath: '/crypto/bn254/g2#subgroup-check'
 * });
 * ```
 */
export class Bn254SubgroupCheckError extends Bn254Error {
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
			code: options?.code || "INVALID_SUBGROUP",
			context: options?.context,
			docsPath: options?.docsPath,
			cause: options?.cause,
		});
		this.name = "Bn254SubgroupCheckError";
	}
}
