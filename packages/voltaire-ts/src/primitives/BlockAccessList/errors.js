import { ValidationError } from "../errors/index.js";

/**
 * Error thrown when a block access list violates EIP-7928 structure,
 * integer ranges, ordering, or uniqueness rules.
 */
export class InvalidBlockAccessListError extends ValidationError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {number} [options.code] - Error code
	 * @param {unknown} [options.value] - Invalid value
	 * @param {string} [options.expected] - Expected value description
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "canonical EIP-7928 block access list",
			context: options?.context,
			docsPath: "/primitives/block-access-list",
			cause: options?.cause,
		});
		this.name = "InvalidBlockAccessListError";
	}
}
