import { ValidationError } from "../errors/index.js";
/**
 * Error thrown when RelayData operations fail
 *
 * @example
 * ```typescript
 * throw new InvalidRelayDataError('Invalid relay data format', {
 *   value: data,
 *   expected: 'valid MEV relay data'
 * })
 * ```
 */
export class InvalidRelayDataError extends ValidationError {
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
            code: -32602,
            value: options?.value,
            expected: options?.expected || "valid relay data",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/relay-data",
            cause: options?.cause,
        });
        this.name = "InvalidRelayDataError";
    }
}
