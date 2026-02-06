import { InvalidRangeError } from "../errors/index.js";

/**
 * Error thrown when LogIndex is invalid (out of range or invalid format)
 *
 * @example
 * ```typescript
 * throw new InvalidLogIndexError('Log index out of range', {
 *   value: -1,
 *   expected: 'non-negative integer',
 *   context: { maxValue: 2147483647 }
 * })
 * ```
 */
export class InvalidLogIndexError extends InvalidRangeError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {number} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected value description
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "valid log index",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/log-index",
			cause: options?.cause,
		});
		this.name = "InvalidLogIndexError";
	}
}
