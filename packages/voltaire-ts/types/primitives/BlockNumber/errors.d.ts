/**
 * Error thrown when BlockNumber is invalid (wrong type or negative)
 * @extends {InvalidRangeError}
 */
export class InvalidBlockNumberError extends InvalidRangeError {
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
import { InvalidRangeError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map