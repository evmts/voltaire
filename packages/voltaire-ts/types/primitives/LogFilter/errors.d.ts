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
     * @param {number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected value description
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Original error
     */
    constructor(message: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { InvalidFormatError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map