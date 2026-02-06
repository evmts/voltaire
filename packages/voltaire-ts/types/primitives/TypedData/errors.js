import { ValidationError } from "../errors/index.js";
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
    constructor(message, options) {
        super(message, {
            code: -32602,
            value: options?.value,
            expected: options?.expected || "valid EIP-712 typed data",
            context: options?.context,
            docsPath: "/primitives/typed-data#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidTypedDataError";
    }
}
