import { ValidationError } from "../errors/index.js";
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
    constructor(message, options) {
        super(message, {
            code: -32602,
            value: options?.value,
            expected: options?.expected || "valid EIP-712 domain",
            context: options?.context,
            docsPath: "/primitives/domain#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidDomainError";
    }
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
    constructor(typeName, options) {
        super(`Type ${typeName} not found in types`, {
            code: -32602,
            value: options?.value ?? typeName,
            expected: "type defined in types object",
            docsPath: "/primitives/domain#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidDomainTypeError";
    }
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
    constructor(message, options) {
        super(message, {
            code: -32602,
            value: options?.value,
            expected: options?.expected || "valid EIP-712 value",
            context: options?.type ? { type: options.type } : undefined,
            docsPath: "/primitives/domain#error-handling",
            cause: options?.cause,
        });
        this.name = "InvalidEIP712ValueError";
    }
}
