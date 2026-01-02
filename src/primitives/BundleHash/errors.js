import { InvalidLengthError, ValidationError } from "../errors/index.js";

/**
 * Error thrown when BundleHash operations fail
 *
 * @example
 * ```typescript
 * throw new InvalidBundleHashError('Invalid bundle hash', {
 *   value: hash,
 *   expected: '32-byte hash'
 * })
 * ```
 */
export class InvalidBundleHashError extends InvalidLengthError {
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
			code: options?.code || "INVALID_BUNDLE_HASH",
			value: options?.value,
			expected: options?.expected || "32-byte bundle hash",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bundle-hash",
			cause: options?.cause,
		});
		this.name = "InvalidBundleHashError";
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
			docsPath: options?.docsPath || "/primitives/bundle-hash",
			cause: options?.cause,
		});
		this.name = "MissingCryptoDependencyError";
	}
}
