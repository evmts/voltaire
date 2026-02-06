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
    constructor(message: string, details?: {
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
    });
    details: {
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
    } | undefined;
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
    constructor(field: string, expected: number, actual: number);
}
import { InvalidFormatError } from "../errors/index.js";
import { InvalidLengthError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map