/**
 * Error for invalid bytes length
 * @extends {BaseInvalidLengthError}
 */
export class InvalidBytesLengthError extends BaseInvalidLengthError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for invalid bytes format
 * @extends {BaseInvalidFormatError}
 */
export class InvalidBytesFormatError extends BaseInvalidFormatError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for invalid value in bytes context
 * @extends {BaseInvalidRangeError}
 */
export class InvalidValueError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for bytes size exceeding target size
 * @extends {BaseInvalidLengthError}
 */
export class SizeExceededError extends BaseInvalidLengthError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for negative number in bytes conversion
 * @extends {BaseInvalidRangeError}
 */
export class NegativeNumberError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for number exceeding MAX_SAFE_INTEGER
 * @extends {BaseInvalidRangeError}
 */
export class UnsafeIntegerError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for non-integer number
 * @extends {BaseInvalidRangeError}
 */
export class NonIntegerError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for bytes too large to convert to number
 * @extends {BaseInvalidRangeError}
 */
export class BytesTooLargeError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for negative bigint in bytes conversion
 * @extends {BaseInvalidRangeError}
 */
export class NegativeBigIntError extends BaseInvalidRangeError {
    /**
     * @param {string} [message]
     * @param {Object} [options]
     * @param {number} [options.code]
     * @param {unknown} [options.value]
     * @param {string} [options.expected]
     * @param {Record<string, unknown>} [options.context]
     * @param {string} [options.docsPath]
     * @param {Error} [options.cause]
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { InvalidLengthError as BaseInvalidLengthError } from "../errors/index.js";
import { InvalidFormatError as BaseInvalidFormatError } from "../errors/index.js";
import { InvalidRangeError as BaseInvalidRangeError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map