import { InvalidFormatError } from "../errors/index.js";
/**
 * Error thrown when TopicFilter is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidTopicFilterError('Invalid topic filter format', {
 *   value: 'invalid',
 *   expected: 'array of Bytes32 or null values'
 * })
 * ```
 */
export class InvalidTopicFilterError extends InvalidFormatError {
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
            expected: options?.expected || "valid topic filter",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/topic-filter",
            cause: options?.cause,
        });
        this.name = "InvalidTopicFilterError";
    }
}
