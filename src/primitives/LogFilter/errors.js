import { InvalidFormatError } from "../errors/index.js";

/**
 * Error thrown when LogFilter is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidLogFilterError('Invalid log filter', {
 *   value: filter,
 *   expected: 'valid log filter with address and/or topics'
 * })
 * ```
 */
export class InvalidLogFilterError extends InvalidFormatError {
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
			code: options?.code || "INVALID_LOG_FILTER",
			value: options?.value,
			expected: options?.expected || "valid log filter",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/log-filter",
			cause: options?.cause,
		});
		this.name = "InvalidLogFilterError";
	}
}
