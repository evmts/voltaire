/**
 * Error thrown when TypedData is invalid
 *
 * @extends {ValidationError}
 */
export class InvalidTypedDataError extends ValidationError {
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {Error} [options.cause]
     */
    constructor(message: string, options?: {
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        cause?: Error | undefined;
    });
}
import { ValidationError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map