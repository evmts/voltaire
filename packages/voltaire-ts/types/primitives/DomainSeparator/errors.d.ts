/**
 * Error thrown when DomainSeparator length is invalid
 *
 * @extends {InvalidLengthError}
 */
export class InvalidDomainSeparatorLengthError extends InvalidLengthError {
    /**
     * @param {string} message
     * @param {object} context
     * @param {unknown} context.value
     * @param {string} context.expected
     * @param {Error} [context.cause]
     */
    constructor(message: string, context: {
        value: unknown;
        expected: string;
        cause?: Error | undefined;
    });
}
import { InvalidLengthError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map