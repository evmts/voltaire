/**
 * Error thrown when address hex format is invalid
 *
 * @throws {InvalidHexFormatError}
 */
export class InvalidHexFormatError extends InvalidFormatError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected format
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when hex string contains invalid characters
 *
 * @throws {InvalidHexStringError}
 */
export class InvalidHexStringError extends InvalidFormatError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected format
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when address has invalid length
 *
 * @throws {InvalidAddressLengthError}
 */
export class InvalidAddressLengthError extends InvalidLengthError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected length
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when value is invalid
 *
 * @throws {InvalidValueError}
 */
export class InvalidValueError extends ValidationError {
    /**
     * @param {string} message - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected value
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when feature is not implemented
 *
 * @throws {NotImplementedError}
 */
export class NotImplementedError extends PrimitiveError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when address is invalid
 *
 * @throws {InvalidAddressError}
 */
export class InvalidAddressError extends ValidationError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected format
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when ABI-encoded address has non-zero padding bytes
 *
 * @throws {InvalidAbiEncodedPaddingError}
 */
export class InvalidAbiEncodedPaddingError extends ValidationError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected format
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error thrown when address checksum is invalid
 *
 * @throws {InvalidChecksumError}
 */
export class InvalidChecksumError extends ValidationError {
    /**
     * @param {string} [message] - Error message
     * @param {object} [options] - Error options
     * @param {string | number} [options.code] - Error code
     * @param {unknown} [options.value] - Invalid value
     * @param {string} [options.expected] - Expected checksum
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Root cause error
     */
    constructor(message?: string, options?: {
        code?: string | number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { InvalidFormatError } from "../errors/index.js";
import { InvalidLengthError } from "../errors/index.js";
import { ValidationError } from "../errors/index.js";
import { PrimitiveError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map