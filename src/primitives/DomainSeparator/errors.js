import { InvalidLengthError } from "../errors/index.js";

/**
 * Error thrown when DomainSeparator length is invalid
 *
 * @extends {InvalidLengthError}
 */
export class InvalidDomainSeparatorLengthError extends InvalidLengthError {
	/**
	 * @param {string} message
	 * @param {object} context
	 * @param {unknown} context.value
	 * @param {string} context.expected
	 * @param {Error} [context.cause]
	 */
	constructor(message, context) {
		super(message, {
			code: -32602,
			value: context.value,
			expected: context.expected,
			docsPath: "/primitives/domain-separator#error-handling",
			cause: context.cause,
		});
		this.name = "InvalidDomainSeparatorLengthError";
	}
}
