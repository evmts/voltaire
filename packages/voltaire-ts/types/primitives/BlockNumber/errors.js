import { InvalidRangeError } from "../errors/index.js";
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
    constructor(message, options) {
        super(message || "Invalid BlockNumber", {
            code: -32602,
            value: options?.value,
            expected: options?.expected || "non-negative integer",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/block-number#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidBlockNumberError";
    }
}
