/**
 * Error thrown when BlockHash byte length is invalid
 * @extends {InvalidLengthError}
 */
export class InvalidBlockHashLengthError extends InvalidLengthError {
    /**
     * @param {string} [message]
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when BlockHash format is invalid
 * @extends {InvalidFormatError}
 */
export class InvalidBlockHashFormatError extends InvalidFormatError {
    /**
     * @param {string} [message]
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { InvalidLengthError } from "../errors/index.js";
import { InvalidFormatError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map