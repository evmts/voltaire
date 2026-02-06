/**
 * @typedef {object} ErrorDetails
 * @property {unknown} [value]
 * @property {string} [expected]
 * @property {Record<string, unknown>} [context]
 * @property {string} [docsPath]
 * @property {Error} [cause]
 */
/**
 * Error thrown when TransactionHash byte length is invalid
 * @extends {InvalidLengthError}
 */
export class InvalidTransactionHashLengthError extends InvalidLengthError {
    /**
     * @param {string} [message]
     * @param {ErrorDetails} [options]
     */
    constructor(message?: string, options?: ErrorDetails);
}
/**
 * Error thrown when TransactionHash format is invalid
 * @extends {InvalidFormatError}
 */
export class InvalidTransactionHashFormatError extends InvalidFormatError {
    /**
     * @param {string} [message]
     * @param {ErrorDetails} [options]
     */
    constructor(message?: string, options?: ErrorDetails);
}
export type ErrorDetails = {
    value?: unknown;
    expected?: string | undefined;
    context?: Record<string, unknown> | undefined;
    docsPath?: string | undefined;
    cause?: Error | undefined;
};
import { InvalidLengthError } from "../errors/index.js";
import { InvalidFormatError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map