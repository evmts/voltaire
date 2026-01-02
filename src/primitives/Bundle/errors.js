import { ValidationError } from "../errors/index.js";

/**
 * Error thrown when bundle operations fail
 *
 * @example
 * ```typescript
 * throw new InvalidBundleError('Bundle contains invalid transaction', {
 *   value: transaction,
 *   expected: 'valid signed transaction',
 *   context: { index: 0 }
 * })
 * ```
 */
export class InvalidBundleError extends ValidationError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected value description
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "INVALID_BUNDLE",
			value: options?.value,
			expected: options?.expected || "valid bundle",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bundle",
			cause: options?.cause,
		});
		this.name = "InvalidBundleError";
	}
}

/**
 * Error thrown when crypto dependency is missing
 */
export class MissingCryptoDependencyError extends ValidationError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected value description
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "MISSING_CRYPTO_DEPENDENCY",
			value: options?.value,
			expected: options?.expected || "crypto function",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bundle",
			cause: options?.cause,
		});
		this.name = "MissingCryptoDependencyError";
	}
}
