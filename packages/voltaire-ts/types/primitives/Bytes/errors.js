import { InvalidFormatError as BaseInvalidFormatError, InvalidLengthError as BaseInvalidLengthError, InvalidRangeError as BaseInvalidRangeError, } from "../errors/index.js";
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
    constructor(message = "Invalid bytes length", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "valid byte length",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "InvalidBytesLengthError";
    }
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
    constructor(message = "Invalid bytes format", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "Uint8Array",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "InvalidBytesFormatError";
    }
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
    constructor(message = "Invalid value", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "valid value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "InvalidValueError";
    }
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
    constructor(message = "Bytes size exceeds target size", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "bytes that fit within target size",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "BytesSizeExceededError";
    }
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
    constructor(message = "Number must be non-negative", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "non-negative number",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "NegativeNumberError";
    }
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
    constructor(message = "Number exceeds MAX_SAFE_INTEGER", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || `number <= ${Number.MAX_SAFE_INTEGER}`,
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "UnsafeIntegerError";
    }
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
    constructor(message = "Number must be an integer", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "integer value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "NonIntegerError";
    }
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
    constructor(message = "Bytes too large to convert to number safely", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "bytes representable as safe integer",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "BytesTooLargeError";
    }
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
    constructor(message = "BigInt must be non-negative", options = {}) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected || "non-negative bigint",
            context: options.context,
            docsPath: options.docsPath || "/primitives/bytes#error-handling",
            cause: options.cause,
        });
        this.name = "NegativeBigIntError";
    }
}
