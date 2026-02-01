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
/**
 * Error thrown when crypto dependency is missing
 */
export class MissingCryptoDependencyError extends ValidationError {
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
import { InvalidLengthError } from "../errors/index.js";
import { ValidationError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map