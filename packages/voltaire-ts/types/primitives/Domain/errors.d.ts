/**
 * Error thrown when Domain is invalid
 *
 * @extends {ValidationError}
 */
export class InvalidDomainError extends ValidationError {
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
/**
 * Error thrown when Domain type is not found
 *
 * @extends {ValidationError}
 */
export class InvalidDomainTypeError extends ValidationError {
    /**
     * @param {string} typeName
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {Error} [options.cause]
     */
    constructor(typeName: string, options?: {
        value?: unknown;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when EIP-712 value encoding fails
 *
 * @extends {ValidationError}
 */
export class InvalidEIP712ValueError extends ValidationError {
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {string} [options.type]
     * @param {Error} [options.cause]
     */
    constructor(message: string, options?: {
        value?: unknown;
        expected?: string | undefined;
        type?: string | undefined;
        cause?: Error | undefined;
    });
}
import { ValidationError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map