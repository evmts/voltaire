import { InvalidFormatError } from "../errors/index.js";
/**
 * Error thrown when FilterId is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidFilterIdError('Invalid filter ID format', {
 *   value: 'invalid',
 *   expected: 'hex string or positive integer'
 * })
 * ```
 */
export class InvalidFilterIdError extends InvalidFormatError {
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
            expected: options?.expected || "valid filter ID",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/filter-id",
            cause: options?.cause,
        });
        this.name = "InvalidFilterIdError";
    }
}
