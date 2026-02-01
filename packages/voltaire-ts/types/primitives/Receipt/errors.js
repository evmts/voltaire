import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
/**
 * Invalid receipt format error
 *
 * @throws {InvalidReceiptError}
 */
export class InvalidReceiptError extends InvalidFormatError {
    /**
     * @param {string} message
     * @param {object} [details]
     * @param {unknown} [details.value]
     * @param {string} [details.expected]
     * @param {Record<string, unknown>} [details.context]
     */
    constructor(message, details) {
        super(`Invalid receipt: ${message}`, {
            code: -32602,
            value: details?.value,
            expected: details?.expected || "valid receipt format",
            context: details?.context,
            docsPath: "/primitives/receipt#error-handling",
        });
        this.name = "InvalidReceiptError";
        if (details) {
            this.details = details;
        }
    }
}
/**
 * Receipt field length error (e.g., logsBloom wrong size)
 *
 * @throws {InvalidReceiptLengthError}
 */
export class InvalidReceiptLengthError extends InvalidLengthError {
    /**
     * @param {string} field - Field name
     * @param {number} expected - Expected length
     * @param {number} actual - Actual length
     */
    constructor(field, expected, actual) {
        super(`${field} must be ${expected} bytes`, {
            code: -32602,
            value: actual,
            expected: `${expected} bytes`,
            context: { field, actualLength: actual },
            docsPath: "/primitives/receipt#error-handling",
        });
        this.name = "InvalidReceiptLengthError";
    }
}
