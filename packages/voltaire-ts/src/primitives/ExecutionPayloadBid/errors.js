import { ValidationError } from "../errors/index.js";

/**
 * Error thrown when an EIP-7732 execution payload bid has a missing field, a
 * byte field of the wrong length, or an integer outside uint64.
 */
export class InvalidExecutionPayloadBidError extends ValidationError {
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
			expected: options?.expected || "EIP-7732 execution payload bid",
			context: options?.context,
			docsPath: "/primitives/execution-payload-bid",
			cause: options?.cause,
		});
		this.name = "InvalidExecutionPayloadBidError";
	}
}
